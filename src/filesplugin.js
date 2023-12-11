/*
 * Copyright (c) 2023 Julien Veyssier <julien-nc@posteo.net>
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */
import ApprovalSvgIcon from '../img/app-dark.svg'
import CheckCircleSvgIcon from '@mdi/svg/svg/check-circle.svg'
import CloseCircleSvgIcon from '@mdi/svg/svg/close-circle.svg'
import PendingIconSvg from '@mdi/svg/svg/dots-horizontal-circle.svg'
import ApprovedIconSvg from '../img/checkmark-green.svg'
import RejectedIconSvg from '../img/close-red.svg'
import { states } from './states.js'

import RequestModal from './components/RequestModal.vue'
import InfoModal from './components/InfoModal.vue'

import axios from '@nextcloud/axios'
import { generateOcsUrl } from '@nextcloud/router'
import { showSuccess, showError, showWarning } from '@nextcloud/dialogs'
import {
	registerFileAction, Permission, FileAction,
} from '@nextcloud/files'
import { emit } from '@nextcloud/event-bus'

import Vue from 'vue'
import './bootstrap.js'

if (!OCA.Approval) {
	OCA.Approval = {
		actionIgnoreLists: [
			'trashbin',
			'files.public',
		],
		requestOnFileChange: false,
	}
}

const inlineAction = new FileAction({
	id: 'approval-inline',
	title: (nodes) => {
		if (nodes.length !== 1) {
			return ''
		}
		const node = nodes[0]
		const state = node.attributes['approval-state']
		return state === states.PENDING
			? t('approval', 'Waiting for authorized users to approve this file')
			: state === states.APPROVABLE
				? t('approval', 'Pending approval, you are authorized to approve')
				: state === states.APPROVED
					? t('approval', 'This element was approved')
					: t('approval', 'This element was rejected')
	},
	displayName: (nodes) => {
		if (nodes.length !== 1) {
			return ''
		}
		const node = nodes[0]

		const state = node.attributes['approval-state']
		return state === states.PENDING
			? t('approval', 'Pending approval')
			: state === states.APPROVABLE
				? t('approval', 'Waiting for your approval')
				: state === states.APPROVED
					? t('approval', 'Approved')
					: t('approval', 'Rejected')
	},
	inline: () => true,
	exec: async (node) => {
		updateNodeApprovalState(node).then(() => {
			console.debug('NEW NODE', node)
			openApprovalInfoModal(node)
		})
		return null
	},
	order: -10,

	iconSvgInline(nodes) {
		const node = nodes[0]

		const state = node.attributes['approval-state']
		return state === states.PENDING || state === states.APPROVABLE
			? PendingIconSvg
			: state === states.APPROVED
				? ApprovedIconSvg
				: RejectedIconSvg
	},
	enabled(nodes) {
		// Only works on single node
		if (nodes.length !== 1) {
			return false
		}

		const node = nodes[0]
		const state = node.attributes['approval-state']

		return (node.permissions & Permission.READ) !== 0
			&& [states.PENDING, states.APPROVABLE, states.APPROVED, states.REJECTED].includes(state)
	},
})
registerFileAction(inlineAction)

const requestAction = new FileAction({
	id: 'approval-request',
	displayName: (nodes) => {
		return t('approval', 'Request approval')
	},
	enabled(nodes, view) {
		if (nodes.length !== 1) {
			return false
		}
		return !OCA.Approval.actionIgnoreLists.includes(view.id)
			&& !nodes.some(({ permissions }) => (permissions & Permission.READ) === 0)
			&& OCA.Approval.userRules && OCA.Approval.userRules.length > 0
		// && nodes.every(({ type }) => type === FileType.File)
		// && nodes.every(({ mime }) => mime === 'application/some+type')
	},
	iconSvgInline: () => ApprovalSvgIcon,
	async exec(node) {
		console.debug('request action', node)
		onRequestAction(node)
		return null
	},
})
registerFileAction(requestAction)

const approveAction = new FileAction({
	id: 'approval-approve',
	displayName: (nodes) => {
		return t('approval', 'Approve')
	},
	enabled(nodes, view) {
		return !OCA.Approval.actionIgnoreLists.includes(view.id)
			&& !nodes.some(({ permissions }) => (permissions & Permission.READ) === 0)
			&& nodes.some(node => node.attributes['approval-state'] === states.APPROVABLE)
		// && nodes.every(({ type }) => type === FileType.File)
		// && nodes.every(({ mime }) => mime === 'application/some+type')
	},
	iconSvgInline: () => CheckCircleSvgIcon,
	async exec(node) {
		console.debug('approve action', node)
		onApproveAction(node)
		return null
	},
	async execBatch(nodes) {
		nodes
			.filter(node => node.attributes['approval-state'] === states.APPROVABLE)
			.forEach(node => {
				onApproveAction(node)
			})
		return nodes.map(_ => null)
	},
})
registerFileAction(approveAction)

const rejectAction = new FileAction({
	id: 'approval-reject',
	displayName: (nodes) => {
		return t('approval', 'Reject')
	},
	enabled(nodes, view) {
		return !OCA.Approval.actionIgnoreLists.includes(view.id)
			&& !nodes.some(({ permissions }) => (permissions & Permission.READ) === 0)
			&& nodes.some(node => node.attributes['approval-state'] === states.APPROVABLE)
		// && nodes.every(({ type }) => type === FileType.File)
		// && nodes.every(({ mime }) => mime === 'application/some+type')
	},
	iconSvgInline: () => CloseCircleSvgIcon,
	async exec(node) {
		console.debug('reject action', node)
		onRejectAction(node)
		return null
	},
	async execBatch(nodes) {
		nodes
			.filter(node => node.attributes['approval-state'] === states.APPROVABLE)
			.forEach(node => {
				onRejectAction(node)
			})
		return nodes.map(_ => null)
	},
})
registerFileAction(rejectAction)

const requestModalId = 'requestApprovalModal'
const requestModalElement = document.createElement('div')
requestModalElement.id = requestModalId
document.body.append(requestModalElement)

const RequestModalView = Vue.extend(RequestModal)
OCA.Approval.RequestModalVue = new RequestModalView().$mount(requestModalElement)

OCA.Approval.RequestModalVue.$on('close', () => {
	console.debug('[Approval] modal closed')
})
OCA.Approval.RequestModalVue.$on('request', (node, ruleId, createShares) => {
	requestApproval(node, ruleId, createShares)
})

const infoModalId = 'approvalInfoModal'
const infoModalElement = document.createElement('div')
infoModalElement.id = infoModalId
document.body.append(infoModalElement)

const InfoModalView = Vue.extend(InfoModal)
OCA.Approval.InfoModalVue = new InfoModalView().$mount(infoModalElement)

OCA.Approval.InfoModalVue.$on('close', () => {
	console.debug('[Approval] modal closed')
})
OCA.Approval.InfoModalVue.$on('approve', (node) => {
	onApproveAction(node)
})
OCA.Approval.InfoModalVue.$on('reject', (node) => {
	onRejectAction(node)
})
OCA.Approval.InfoModalVue.$on('request', (node) => {
	onRequestAction(node)
})

function getApprovalState(node) {
	const url = generateOcsUrl('apps/approval/api/v1/state/' + node.fileid, 2)
	return axios.get(url)
}

function updateNodeApprovalState(node) {
	return getApprovalState(node).then(response => {
		const state = response.data.ocs.data.state
		Vue.set(node.attributes, 'approval-state', state)
		Vue.set(node.attributes, 'approval-rule', response.data.ocs.data.rule)
		Vue.set(node.attributes, 'approval-timestamp', response.data.ocs.data.timestamp)
		Vue.set(node.attributes, 'approval-userId', response.data.ocs.data.userId)
		Vue.set(node.attributes, 'approval-userName', response.data.ocs.data.userName)
		emit('files:node:updated', node)
	}).catch((error) => {
		showError(
			t('approval', 'Failed to check approval status'),
		)
		console.error(error)
	})
}

function requestApproval(node, ruleId, createShares) {
	const fileId = node.fileid
	const fileName = node.basename
	const req = {
		createShares,
	}
	const url = generateOcsUrl('apps/approval/api/v1/request/' + fileId + '/' + ruleId, 2)
	axios.post(url, req).then((response) => {
		if (createShares) {
			requestAfterShareCreation(node, ruleId)
		} else {
			showSuccess(t('approval', 'Approval requested for {name}', { name: fileName }))
			if (response.data?.ocs?.data?.warning) {
				showWarning(t('approval', 'Warning') + ': ' + response.data.ocs.data.warning)
			}
			updateNodeApprovalState(node)
			// TODO
			// reloadTags()
		}
	}).catch((error) => {
		showError(
			t('approval', 'Failed to request approval for {name}', { name: fileName })
			+ ': ' + (error.response?.data?.ocs?.data?.error ?? error.response?.request?.responseText ?? ''),
		)
		console.error(error)
	})
}

function requestAfterShareCreation(node, ruleId) {
	const fileId = node.fileid
	const fileName = node.basename
	console.debug('requestAfterShareCreation node', node)
	const req = {
		createShares: false,
	}
	const url = generateOcsUrl('apps/approval/api/v1/request/' + fileId + '/' + ruleId, 2)
	axios.post(url, req).then((response) => {
		showSuccess(t('approval', 'Approval requested for {name}', { name: fileName }))
		if (response.data?.ocs?.data?.warning) {
			showWarning(t('approval', 'Warning') + ': ' + response.data.ocs.data.warning)
		}
		updateNodeApprovalState(node)
		// TODO
		// reloadTags()
	}).catch((error) => {
		showError(
			t('approval', 'Failed to request approval for {name}', { name: fileName })
			+ ': ' + (error.response?.data?.ocs?.data?.error ?? error.response?.request?.responseText ?? ''),
		)
	})
}

function onApproveAction(node) {
	const fileId = node.fileid
	const fileName = node.basename
	const url = generateOcsUrl('apps/approval/api/v1/approve/' + fileId, 2)
	axios.put(url, {}).then((response) => {
		showSuccess(t('approval', 'You approved {name}', { name: fileName }))
		updateNodeApprovalState(node)
	}).catch((error) => {
		console.error(error)
		showError(
			t('approval', 'Failed to approve {name}', { name: fileName })
			+ ': ' + error.response?.request?.responseText,
		)
	})
}

function onRejectAction(node) {
	const fileId = node.fileid
	const fileName = node.basename
	const url = generateOcsUrl('apps/approval/api/v1/reject/' + fileId, 2)
	axios.put(url, {}).then((response) => {
		showSuccess(t('approval', 'You rejected {name}', { name: fileName }))
		updateNodeApprovalState(node)
	}).catch((error) => {
		console.error(error)
		showError(
			t('approval', 'Failed to reject {name}', { name: fileName })
			+ ': ' + error.response?.request?.responseText,
		)
	})
}

function getUserRequesterRules(fileId = null) {
	const req = fileId === null
		? null
		: {
			params: {
				fileId,
			},
		}
	const url = generateOcsUrl('apps/approval/api/v1/user-requester-rules', 2)
	return fileId === null
		? axios.get(url)
		: axios.get(url, req)
}

function onRequestAction(node) {
	const fileId = node.fileid
	OCA.Approval.RequestModalVue.showModal()
	// refresh request rules when opening request modal
	getUserRequesterRules(fileId).then((response) => {
		OCA.Approval.RequestModalVue.setUserRules(response.data.ocs.data)
		OCA.Approval.RequestModalVue.setNode(node)
		OCA.Approval.userRules = response.data.ocs.data
	}).catch((error) => {
		console.error(error)
	})
}

function openApprovalInfoModal(node) {
	OCA.Approval.InfoModalVue.setNode(node)
	OCA.Approval.InfoModalVue.setUserRules([])
	OCA.Approval.InfoModalVue.showModal()
	getUserRequesterRules(node.fileid).then(response => {
		OCA.Approval.InfoModalVue.setUserRules(response.data.ocs.data)
	})
}

// on page load: get rules that the current user is able to request with
getUserRequesterRules().then((response) => {
	OCA.Approval.userRules = response.data.ocs.data
}).catch((error) => {
	console.error(error)
})
