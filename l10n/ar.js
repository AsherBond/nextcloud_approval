OC.L10N.register(
    "approval",
    {
    "You approved {file}" : "لقد وافقت على {file}",
    "{user} approved {file}" : "{user} وافق على {file}",
    "You rejected {file}" : "لقد رفضت{file}",
    "{user} rejected {file}" : "{user} رفض {file}",
    "Your approval was requested on {file}" : "تمّ طلب موافقتك على {file}",
    "Your approval was requested on {file} by {who}" : "تمّ طلب موافقتك على {file} من قِبَل {who}",
    "You requested approval on {file}" : "أنت طلبت الموافقة على {file}",
    "A guest user" : "مستخدم ضيف",
    "Approval" : "موافقة",
    "<strong>Approval</strong> events" : "<strong>موافقة</strong> مرّات",
    "Error getting OAuth access token" : "حدث خطأ أثناء محاولة الحصول على أَمَارَة token للتصديق المفتوح OAuth",
    "Error during OAuth exchanges" : "حدث خطأ أثناء تبادلات exchanges التصديق المفتوح OAuth",
    "Pending approvals" : "مُعلّقة في انتظار الموافقة",
    "A file was approved" : "تمّت الموافقة على الملف",
    "A file was rejected" : "تمّ رفض الملف ",
    "A directory was approved" : "تمّت الموافقة على الدليل directory",
    "A directory was rejected" : "تمّ رفض الدليل directory",
    "%1$s approved %2$s" : "%1$s وافق على%2$s",
    "%1$s rejected %2$s" : "%1$s رفض %2$s",
    "{user} approved {node}" : "{user} وافق على {node}",
    "{user} rejected {node}" : "{user} رفض {file}",
    "Your approval was requested" : "تمّ طلب موافقتك",
    "%2$s requested your approval for %1$s" : "%2$s طلب موافقتك على %1$s",
    "{user} requested your approval for {node}" : "{user} طلب موافقتك على {node}",
    "Rule does not exist" : "لا توجد أي شروط",
    "This element is not shared with any user who is authorized to approve it" : "هذا العنصر لم تتم مشاركته مع أي مستخدم مُخوّلٍ بالموافقة عليه",
    "Approval has already been requested with this rule for this file" : "تمّ سلفاً طلب الموافقة على هذا الملف تبعاً لهذا الشرط",
    "You are not authorized to request with this rule" : "غير مصرح لك بالطلب تبعاً لهذا الشرط",
    "Please check my approval request" : "رجاءً، راجع طلبي بالموافقة",
    "Signature of %s" : "توقيع %s",
    "Bad HTTP method" : "وظيفة HTTP  غير صحيحة",
    "Bad credentials" : "حيثيّات الدخول credentials غير صحيحة",
    "OAuth access token refused" : "تمّ رفض أَمَارَة token  للتصديق المفتوح OAuth",
    "Approval workflows" : "تدفُّقات workflows الموافقات ",
    "Let users approve or reject files" : "دعِ المستخدمين يوافقون على أو يرفضون الملفات",
    "Approve/reject files based on workflows defined by admins." : "الموافقة/الرفض للملفات بناءً على تدفُّقات إجرائية workflows سبق تعريفها من المشرفين",
    "Each workflow defines who (which users, groups or circles) can approve files for a given pending tag and which approved/rejected tag should then be assigned." : "يحدد كل تدفُّق إجرائي WF مَنْ (مِنَ المستخدمين أو المجموعات أو الدوائر) يمكنه الموافقة على الملفات الموسومة بوسم \"مُعلّق\" pending tag معين، و أي وسم يوضع عليها في حال القبول و أي رسم يوضع عليها في حال الرفض.",
    "A list of users/groups/circles who can manually request approval can be optionally defined." : "يمكن تحديد قائمة المستخدمين / المجموعات / الدوائر الذين يمكنهم طلب الموافقة يدويًا بشكل اختياري.",
    "To be considered approved, a file/directory having multiple pending tags assigned must be approved by all the workflows involved." : "لكي يتم اعتبار الملف أو الدليل الذي يحتوي على عدد من سمات التعليق pending tags l مُوافقاً عليه، يجب أن تتم الموافقة عليه من قِبَل جميع المهام tasks في التدفق الإجرائي WF الذي يتبعه.",
    "You can chain approval workflows by using a pending tag as approved/rejected tag in another workflow." : "يمكن وضع مجموعة موافقات في شكل سلسلة chain approval؛ و ذلك بوضع سمة التعليق pending tag على الملف عقب الموافقة عليه أو رفضه ليتم إرسالة إلى التدفق الإجرائي WF التالي.",
    "All tags must be different in a workflow. A pending tag can only be used in one workflow." : "جميع السمات في التدفق الإجرائي الواحد WF tags يجب أن تكون مختلفة عن بعضها البعض. و \"مُعلّق\" التعليق pending tag يمكن فقط استخدامها في تدفق إجرائي واحد.",
    "Delete workflow" : "إحذِف التدفق الإجرائي Workflow",
    "No workflow yet" : "لا يوجد تدفق إجرائي WF حتى الآن",
    "New workflow" : "تدفُّق إجرائي WF جديد",
    "Create new hidden tag" : "أنشِيء سِمَة جديدة مَخفيّة tag ",
    "New tag name" : "اسم سِمَة جديدة ",
    "Create" : "إنشاء",
    "Cancel" : "إلغاء",
    "All fields are required" : "جميع الحقول مطلوبة",
    "All tags must be different" : "كل الوسوم يجب أن تكون مختلفة",
    "Pending tag is already used in another workflow" : "سمة \"مُعلّق\" pending tag مستخدمةٌ سلفاً في تدفق إجرائي WF آخر",
    "Create workflow" : "إنشِيء تدفُّقاً إجرائيّاً WF",
    "Failed to get approval workflows" : "تعذّر تحصيل تدفُّقات الموافقة",
    "Approval workflow saved" : "تمّ حفظ التدفُّق الإجرائي للموافقة WF",
    "Failed to save approval workflow" : "تعذّر حفظ التدفُّق الإجرائي للموافقة WF",
    "New approval workflow created" : "تمّ إنشاء تدفُّق إجرائي جديد للموافقة WF ",
    "Failed to create approval workflow" : "تعذّر إنشاء تدفُّق إجرائي للموافقة WF ",
    "Approval workflow deleted" : "تم حذف تدفُّق إجرائي للموافقة WF ",
    "Failed to delete approval workflow" : "تعذّر حذف تدفُّق إجرائي للموافقة WF ",
    "Tag \"{name}\" created" : "سمة \"{name}\" تمّ إنشاؤها",
    "Failed to create tag \"{name}\"" : "تعذّر إنشاء السمة \"{name}\"",
    "Approve" : "موافقة",
    "Reject" : "رفض",
    "Select pending tag" : "إختَر سِمَة \"مُعلّق\" pending tag",
    "Who can request approval?" : "من له حق طلب الموافقة؟",
    "Who can approve?" : "من له حق الموافقة؟",
    "Select approved tag" : "إختَر سمة \"تمّت الموافقة\" approved tag",
    "Select rejected tag" : "إختَر سمة \"مرفوضٌ\" rejected tag",
    "Who can request approval" : "من له حق طلب الموافقة",
    "Who can approve" : "من له حق الموافقة",
    "Approved" : "تم قبوله",
    "you" : "أنت",
    "Request approval" : "طلب موافقة",
    "Sign with DocuSign" : "تسجيل الدخول بواسطة DocuSign",
    "Connected as {user} ({email})" : "متصل بصفته {مستخدم} ({البريد الإلكتروني})",
    "No recommendations. Start typing." : "لا توجد توصيات. ابدأ بالكتابة.",
    "No result." : "لا يوجد نتيجة",
    "Warning" : "تحذير"
},
"nplurals=6; plural=n==0 ? 0 : n==1 ? 1 : n==2 ? 2 : n%100>=3 && n%100<=10 ? 3 : n%100>=11 && n%100<=99 ? 4 : 5;");
