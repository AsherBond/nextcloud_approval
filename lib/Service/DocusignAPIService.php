<?php
/**
 * Nextcloud - zammad
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Julien Veyssier
 * @copyright Julien Veyssier 2020
 */

namespace OCA\Approval\Service;

use OCP\IL10N;
use Psr\Log\LoggerInterface;
use OCP\IConfig;
use OCP\IUserManager;
use OCP\IUser;
use OCP\Files\File;
use OCP\Http\Client\IClientService;
use OCP\Notification\IManager as INotificationManager;
use GuzzleHttp\Exception\ClientException;
use GuzzleHttp\Exception\ServerException;
use GuzzleHttp\Exception\ConnectException;
use OCP\Files\IRootFolder;

use OCA\Approval\AppInfo\Application;

class DocusignAPIService {

	private $l10n;
	private $logger;

	/**
	 * Service to make requests to DocuSign
	 */
	public function __construct (IUserManager $userManager,
								string $appName,
								LoggerInterface $logger,
								IL10N $l10n,
								IConfig $config,
								IRootFolder $root,
								INotificationManager $notificationManager,
								IClientService $clientService) {
		$this->appName = $appName;
		$this->l10n = $l10n;
		$this->logger = $logger;
		$this->config = $config;
		$this->root = $root;
		$this->userManager = $userManager;
		$this->clientService = $clientService;
		$this->notificationManager = $notificationManager;
		$this->client = $clientService->newClient();
	}

	public function emailSign(int $fileId, string $signerUserId, ?string $ccUserId = null): array {
		$found = $this->root->getById($fileId);
		if (count($found) > 0) {
			$file = $found[0];
		} else {
			return ['error' => 'File not found'];
		}

		$accessToken = $this->config->getAppValue(Application::APP_ID, 'docusign_token', '');
		$refreshToken = $this->config->getAppValue(Application::APP_ID, 'docusign_refresh_token', '');
		$clientID = $this->config->getAppValue(Application::APP_ID, 'docusign_client_id', '');
		$clientSecret = $this->config->getAppValue(Application::APP_ID, 'docusign_client_secret', '');
		$accountId = $this->config->getAppValue(Application::APP_ID, 'docusign_user_account_id', '');
		$baseURI = $this->config->getAppValue(Application::APP_ID, 'docusign_user_base_uri', '');

		$signerUser = $this->userManager->get($signerUserId);
		if ($signerUser === null) {
			return ['error' => 'Signer user not found'];
		}
		$signerName = $signerUser->getDisplayName();
		$signerEmail = $signerUser->getEMailAddress();

		$ccEmail = null;
		$ccName = null;
		if (!is_null($ccUserId)) {
			$ccUser = $this->userManager->get($ccUserId);
			if ($ccUser === null) {
				return ['error' => 'CC user not found'];
			}
			$ccName = $ccUser->getDisplayName();
			$ccEmail = $ccUser->getEMailAddress();
		}

		return $this->emailSignRequest($accessToken, $refreshToken, $clientID, $clientSecret,
			$baseURI, $accountId, $file,
			$signerUserId, $signerEmail, $signerName,
			$ccUserId, $ccEmail, $ccName);
	}

	public function emailSignRequest(string $accessToken, string $refreshToken, string $clientID, string $clientSecret,
							string $baseURI, string $accountId,
							File $file,
							string $signerUserId, string $signerEmail, string $signerName,
							?string $ccUserId, ?string $ccEmail, ?string $ccName): array {
		$docB64 = base64_encode($file->getContent());
		$enveloppe = [
			'emailSubject' => $this->l10n->t('Signature of %s', $file->getName()),
			'documents' => [
				[
					'documentBase64' => $docB64,
					'name' => $file->getName(),
					'fileExtension' => 'pdf',
					'documentId' => $file->getId(),
				],
			],
			'recipients' => [
				'carbonCopies' => [],
				'signers' => [
					[
						'email' => $signerEmail,
						'name' => $signerName,
						'recipientId' => '1',
						'routingOrder' => '1',
						'tabs' => [
							'signHereTabs' => [
								[
									'anchorString' => '**signature_1**',
									'anchorUnits' => 'pixels',
									'anchorXOffset' => '20',
									'anchorYOffset' => '10',
								],
								[
									'anchorString' => '/sn1/',
									'anchorUnits' => 'pixels',
									'anchorXOffset' => '20',
									'anchorYOffset' => '10',
								],
							],
						],
					],
				],
			],
			'status' => 'sent',
		];

		// CC is optional
		if ($ccUserId && $ccName && $ccEmail) {
			$enveloppe['recipients']['carbonCopies'][] = [
				'email' => $ccEmail,
				'name' => $ccName,
				'recipientId' => '2',
				'routingOrder' => '2',
			];
		}

		$endPoint = '/restapi/v2.1/accounts/' . $accountId .'/envelopes';
		$info = $this->apiRequest($baseURI, $accessToken, $refreshToken, $clientID, $clientSecret, $endPoint, $enveloppe, 'POST');
		return $info;
	}

	/**
	 * @param string $url
	 * @param string $accessToken
	 * @param string $authType
	 * @param string $refreshToken
	 * @param string $clientID
	 * @param string $clientSecret
	 * @param string $endPoint
	 * @param array $params
	 * @param string $method
	 * @return array
	 */
	public function apiRequest(?string $url, string $accessToken, string $refreshToken,
							string $clientID, string $clientSecret,
							string $endPoint = '', array $params = [], string $method = 'GET'): array {
		try {
			$url = $url . $endPoint;
			$options = [
				'headers' => [
					'Authorization'  => 'Bearer ' . $accessToken,
					'User-Agent' => 'Nextcloud DocuSign integration',
					'Content-Type' => 'application/json',
				]
			];

			if (count($params) > 0) {
				if ($method === 'GET') {
					// manage array parameters
					$paramsContent = '';
					foreach ($params as $key => $value) {
						if (is_array($value)) {
							foreach ($value as $oneArrayValue) {
								$paramsContent .= $key . '[]=' . urlencode($oneArrayValue) . '&';
							}
							unset($params[$key]);
						}
					}
					$paramsContent .= http_build_query($params);
					$url .= '?' . $paramsContent;
				} else {
					$options['body'] = json_encode($params);
				}
			}

			if ($method === 'GET') {
				$response = $this->client->get($url, $options);
			} else if ($method === 'POST') {
				$response = $this->client->post($url, $options);
			} else if ($method === 'PUT') {
				$response = $this->client->put($url, $options);
			} else if ($method === 'DELETE') {
				$response = $this->client->delete($url, $options);
			}
			$body = $response->getBody();
			$respCode = $response->getStatusCode();

			if ($respCode >= 400) {
				return ['error' => $this->l10n->t('Bad credentials')];
			} else {
				return json_decode($body, true);
			}
		} catch (ServerException | ClientException $e) {
			$response = $e->getResponse();
			$body = (string) $response->getBody();
			// refresh token if it's invalid and we are using oauth
			// response can be : 'OAuth2 token is expired!', 'Invalid token!' or 'Not authorized'
			if ($response->getStatusCode() === 401) {
				// $this->logger->info('Trying to REFRESH the access token', ['app' => $this->appName]);
				$this->logger->warning('Trying to REFRESH the DocuSign access token', ['app' => $this->appName]);
				// try to refresh the token
				$docusignTokenUrl = Application::DOCUSIGN_TOKEN_REQUEST_URL;
				$result = $this->requestOAuthAccessToken($docusignTokenUrl, $clientID, $clientSecret, [
					'client_id' => $clientID,
					'client_secret' => $clientSecret,
					'grant_type' => 'refresh_token',
					'refresh_token' => $refreshToken,
				], 'POST');
				if (isset($result['access_token'])) {
					$accessToken = $result['access_token'];
					$this->config->setAppValue(Application::APP_ID, 'docusign_token', $accessToken);
					// is there a new refresh token?
					if (isset($result['refresh_token'])) {
						$refreshToken = $result['refresh_token'];
						$this->config->setAppValue(Application::APP_ID, 'docusign_refresh_token', $refreshToken);
					}
					// store new expiration time
					if (isset($result['expires_in'])) {
						$this->config->setAppValue(Application::APP_ID, 'docusign_token_expires_in', $result['expires_in']);
					}
					// retry the request with new access token
					return $this->apiRequest(
						$url, $accessToken, $refreshToken, $clientID, $clientSecret, $endPoint, $params, $method
					);
				}
			}
			$this->logger->warning('DocuSign API error : '.$e->getMessage(), ['app' => $this->appName]);
			return ['error' => $e->getMessage()];
		} catch (ConnectException $e) {
			return ['error' => $e->getMessage()];
		}
	}

	/**
	 * @param string $url
	 * @param array $params
	 * @param string $method
	 * @return array
	 */
	public function requestOAuthAccessToken(string $url, string $clientId, string $clientSecret,
											array $params = [], string $method = 'GET'): array {
		try {
			$b64Credentials = base64_encode($clientId . ':' . $clientSecret);
			$options = [
				'headers' => [
					'User-Agent'  => 'Nextcloud DocuSign integration',
					'Authorization' => 'Basic ' . $b64Credentials,
				],
			];

			if (count($params) > 0) {
				if ($method === 'GET') {
					$paramsContent = http_build_query($params);
					$url .= '?' . $paramsContent;
				} else {
					$options['body'] = $params;
				}
			}

			if ($method === 'GET') {
				$response = $this->client->get($url, $options);
			} else if ($method === 'POST') {
				$response = $this->client->post($url, $options);
			} else if ($method === 'PUT') {
				$response = $this->client->put($url, $options);
			} else if ($method === 'DELETE') {
				$response = $this->client->delete($url, $options);
			}
			$body = $response->getBody();
			$respCode = $response->getStatusCode();

			if ($respCode >= 400) {
				return ['error' => $this->l10n->t('OAuth access token refused')];
			} else {
				return json_decode($body, true);
			}
		} catch (\Exception $e) {
			$this->logger->warning('DocuSign OAuth error : '.$e->getMessage(), ['app' => $this->appName]);
			return ['error' => $e->getMessage()];
		}
	}
}
