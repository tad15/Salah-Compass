'use strict';
/* ====== Langues : français (source), anglais, arabe ====== */
const APP_VERSION = '2.9';
const LANGS = [['fr', 'Français'], ['en', 'English'], ['ar', 'العربية'], ['es', 'Español'], ['de', 'Deutsch'], ['tr', 'Türkçe'], ['id', 'Bahasa Indonesia'], ['ur', 'اردو']];
const LANG_CODES = LANGS.map(l => l[0]);
const LANG = (() => {
  let l = null;
  try { l = (JSON.parse(localStorage.getItem('qs') || '{}')).lang; } catch (e) { l = null; }
  if (LANG_CODES.indexOf(l) >= 0) return l;
  const n = String(navigator.language || 'fr').slice(0, 2).toLowerCase();
  return LANG_CODES.indexOf(n) >= 0 ? n : 'fr';
})();
const RTL = LANG === 'ar' || LANG === 'ur';
const LOCALE = { fr: 'fr-FR', en: 'en-GB', ar: 'ar', es: 'es-ES', de: 'de-DE', tr: 'tr-TR', id: 'id-ID', ur: 'ur-PK' }[LANG];
document.documentElement.lang = LANG;
document.documentElement.dir = RTL ? 'rtl' : 'ltr';

const DICT = {};
/** K(français, anglais, arabe) */
function K(fr, en, ar) { DICT[fr] = { en, ar }; }
function tr(k) {
  let s = k;
  if (LANG !== 'fr') { const d = DICT[k]; if (d) s = d[LANG] != null ? d[LANG] : (d.en != null ? d.en : k); }
  for (let i = 1; i < arguments.length; i++) s = s.split('{' + (i - 1) + '}').join(arguments[i]);
  return s;
}

/* ---- Navigation, général ---- */
K('Prières', 'Prayers', 'الصلوات');
K('Coran', 'Quran', 'القرآن');
K('Qibla', 'Qibla', 'القبلة');
K('Calendrier', 'Calendar', 'التقويم');
K('Réglages', 'Settings', 'الإعدادات');
K('Retour', 'Back', 'رجوع');
K('Navigation principale', 'Main navigation', 'التنقل الرئيسي');
K('Chargement…', 'Loading…', 'جارٍ التحميل…');
K('Erreur d’affichage : ', 'Display error: ', 'خطأ في العرض: ');
K('Ma position', 'My location', 'موقعي');

/* ---- Villes ---- */
[['Paris', 'Paris', 'باريس'], ['Marseille', 'Marseille', 'مرسيليا'], ['Lyon', 'Lyon', 'ليون'], ['Toulouse', 'Toulouse', 'تولوز'],
['Nice', 'Nice', 'نيس'], ['Nantes', 'Nantes', 'نانت'], ['Strasbourg', 'Strasbourg', 'ستراسبورغ'], ['Montpellier', 'Montpellier', 'مونبلييه'],
['Bordeaux', 'Bordeaux', 'بوردو'], ['Lille', 'Lille', 'ليل'], ['Rennes', 'Rennes', 'رين'], ['Reims', 'Reims', 'ريمس'],
['Grenoble', 'Grenoble', 'غرونوبل'], ['Dijon', 'Dijon', 'ديجون'], ['Le Havre', 'Le Havre', 'لو هافر'], ['Toulon', 'Toulon', 'تولون'],
['Saint-Étienne', 'Saint-Étienne', 'سانت إتيان'], ['Angers', 'Angers', 'أنجيه'], ['Nîmes', 'Nîmes', 'نيم'], ['Clermont-Ferrand', 'Clermont-Ferrand', 'كليرمون فيران'],
['Metz', 'Metz', 'ميتز'], ['Perpignan', 'Perpignan', 'بربينيان'], ['Limoges', 'Limoges', 'ليموج'], ['Tours', 'Tours', 'تور'],
['Amiens', 'Amiens', 'أميان'], ['Rouen', 'Rouen', 'روان'], ['Caen', 'Caen', 'كاين'], ['Brest', 'Brest', 'بريست'],
['Orléans', 'Orléans', 'أورليان'], ['Mulhouse', 'Mulhouse', 'مولوز'], ['Ajaccio', 'Ajaccio', 'أجاكسيو'],
['Bruxelles', 'Brussels', 'بروكسل'], ['Genève', 'Geneva', 'جنيف'], ['Londres', 'London', 'لندن'], ['Alger', 'Algiers', 'الجزائر'],
['Casablanca', 'Casablanca', 'الدار البيضاء'], ['Tunis', 'Tunis', 'تونس'], ['Dakar', 'Dakar', 'داكار'], ['Istanbul', 'Istanbul', 'إسطنبول'],
['La Mecque', 'Mecca', 'مكة المكرمة'], ['Médine', 'Medina', 'المدينة المنورة']].forEach(c => K(c[0], c[1], c[2]));

/* ---- Prières ---- */
const PNAMES = {
  fr: { fajr: 'Fajr', sunrise: 'Lever du soleil', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' },
  en: { fajr: 'Fajr', sunrise: 'Sunrise', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' },
  ar: { fajr: 'الفجر', sunrise: 'الشروق', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' },
  es: { fajr: 'Fajr', sunrise: 'Amanecer', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Magrib', isha: 'Isha' },
  de: { fajr: 'Fadschr', sunrise: 'Sonnenaufgang', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Ischa' },
  tr: { fajr: 'İmsak', sunrise: 'Güneş', dhuhr: 'Öğle', asr: 'İkindi', maghrib: 'Akşam', isha: 'Yatsı' },
  id: { fajr: 'Subuh', sunrise: 'Terbit', dhuhr: 'Zuhur', asr: 'Asar', maghrib: 'Magrib', isha: 'Isya' },
  ur: { fajr: 'فجر', sunrise: 'طلوعِ آفتاب', dhuhr: 'ظہر', asr: 'عصر', maghrib: 'مغرب', isha: 'عشاء' }
};
K('{0} dans {1} min', '{0} in {1} min', '{0} بعد {1} دقيقة');
K('Prière de {0} à {1} ({2})', '{0} prayer at {1} ({2})', 'صلاة {0} عند {1} ({2})');
K('Il est l’heure de la prière de {0}', 'It is time for the {0} prayer', 'حان وقت صلاة {0}');
K('Méthode : {0}', 'Method: {0}', 'الطريقة: {0}');
K('dans {0} h {1} min', 'in {0} h {1} min', 'بعد {0} س {1} د');
K('dans {0} min {1} s', 'in {0} min {1} s', 'بعد {0} د {1} ث');
K('dans {0} s', 'in {0} s', 'بعد {0} ث');
K('Notification', 'Notification', 'إشعار');
K('Désactivée', 'Off', 'متوقف');
K('Rappels désactivés', 'Reminders off', 'التذكيرات متوقفة');
K('Fin de la prière de Fajr', 'End of the Fajr prayer time', 'نهاية وقت صلاة الفجر');
K('Joumou‘a', 'Jumu‘ah', 'الجمعة');
K('{0} : {1}. Changer', '{0}: {1}. Change', '{0}: {1}. تغيير');
K('Prochaine prière', 'Next prayer', 'الصلاة القادمة');
K('demain', 'tomorrow', 'غدًا');
K('Horaires du jour', 'Today’s times', 'مواقيت اليوم');
K('Les rappels et l’adhan fonctionnent uniquement dans l’application Android installée.', 'Reminders and the adhan only work in the installed Android app.', 'التذكيرات والأذان تعمل فقط في تطبيق أندرويد المثبّت.');
K('Les rappels sont désactivés.', 'Reminders are turned off.', 'التذكيرات متوقفة.');
K('Ouvrir les réglages', 'Open settings', 'فتح الإعدادات');
K('Les notifications sont bloquées : sans elles, aucun rappel ni adhan ne sera joué.', 'Notifications are blocked: without them, no reminder or adhan will play.', 'الإشعارات محظورة: بدونها لن يعمل أي تذكير أو أذان.');
K('Autoriser les notifications', 'Allow notifications', 'السماح بالإشعارات');
K('Si rien ne s’affiche, autorisez-les dans Réglages Android › Applications › Salah Compass › Notifications.', 'If nothing appears, allow them in Android Settings › Apps › Salah Compass › Notifications.', 'إن لم يظهر شيء، اسمح بها من إعدادات أندرويد › التطبيقات › Salah Compass › الإشعارات.');
K('Autorisez les notifications dans la fenêtre Android.', 'Allow notifications in the Android window.', 'اسمح بالإشعارات في نافذة أندرويد.');
K('Cour de la Kaaba, de nuit', 'Courtyard of the Kaaba, at night', 'ساحة الكعبة ليلًا');
K('Cour de la Kaaba, au crépuscule', 'Courtyard of the Kaaba, at dusk', 'ساحة الكعبة عند الغروب');
K('Cour de la Kaaba, de jour', 'Courtyard of the Kaaba, by day', 'ساحة الكعبة نهارًا');

/* ---- Méthodes de calcul ---- */
K('UOIF (France) · 12°', 'UOIF (France) · 12°', 'اتحاد المنظمات الإسلامية (فرنسا) · 12°');
K('Ligue islamique mondiale · 18° / 17°', 'Muslim World League · 18° / 17°', 'رابطة العالم الإسلامي · 18° / 17°');
K('ISNA · 15°', 'ISNA · 15°', 'أمريكا الشمالية (ISNA) · 15°');
K('Égypte · 19,5° / 17,5°', 'Egypt · 19.5° / 17.5°', 'مصر · 19.5° / 17.5°');
K('Umm al-Qura · 18,5° / Isha +90 min', 'Umm al-Qura · 18.5° / Isha +90 min', 'أم القرى · 18.5° / العشاء +90 دقيقة');
K('Diyanet (Turquie) · 18° / 17°', 'Diyanet (Turkey) · 18° / 17°', 'ديانت (تركيا) · 18° / 17°');

/* ---- Réglages ---- */
K('Langue', 'Language', 'اللغة');
K('Apparence', 'Appearance', 'المظهر');
K('Automatique', 'Automatic', 'تلقائي');
K('Clair', 'Light', 'فاتح');
K('Sombre', 'Dark', 'داكن');
K('Bleu minuit', 'Midnight blue', 'أزرق منتصف الليل');
K('Gris clair', 'Light gray', 'رمادي فاتح');
K('Noir', 'Black', 'أسود');
K('Blanc cassé', 'Off-white', 'أبيض مائل');
K('Violet', 'Purple', 'بنفسجي');
K('Jaune', 'Yellow', 'أصفر');
K('Rose', 'Pink', 'وردي');
K('Bleu ciel', 'Sky blue', 'أزرق سماوي');
K('Océan', 'Ocean', 'محيطي');
K('« Automatique » suit le mode clair ou sombre du téléphone.', '“Automatic” follows the phone’s light or dark mode.', '«تلقائي» يتبع الوضع الفاتح أو الداكن للهاتف.');
K('Position', 'Location', 'الموقع');
K('Position automatique', 'Automatic location', 'الموقع التلقائي');
K('Position non obtenue (autorisez la localisation)', 'Location not available (allow location access)', 'تعذّر تحديد الموقع (اسمح بالوصول إلى الموقع)');
K('Actualiser la position', 'Refresh location', 'تحديث الموقع');
K('Localiser', 'Locate', 'تحديد');
K('Ville', 'City', 'المدينة');
K('Calcul des horaires', 'Prayer time calculation', 'حساب المواقيت');
K('Méthode', 'Method', 'الطريقة');
K('Méthode de calcul', 'Calculation method', 'طريقة الحساب');
K('Asr', 'Asr', 'العصر');
K('Ombre = 1 ou 2 fois l’objet', 'Shadow = 1 or 2 times the object', 'الظل = مثل الشيء أو مثلاه');
K('Standard', 'Standard', 'قياسي');
K('Hanafite', 'Hanafi', 'حنفي');
K('Date hégirienne', 'Hijri date', 'التاريخ الهجري');
K('Ajustement selon l’observation locale', 'Adjust to local moon sighting', 'تعديل حسب الرؤية المحلية');
K('Rappels', 'Reminders', 'التذكيرات');
K('Rappels de prière', 'Prayer reminders', 'تذكيرات الصلاة');
K('Interrupteur général', 'Master switch', 'المفتاح العام');
K('Aucun', 'None', 'بدون');
K('Notif.', 'Notif.', 'إشعار');
K('Adhan', 'Adhan', 'أذان');
K('Prévenir avant', 'Notify before', 'التنبيه قبل');
K('Notification discrète avant la prière', 'Discreet notification before the prayer', 'إشعار هادئ قبل الصلاة');
K('Non', 'No', 'لا');
K('Notifications Android', 'Android notifications', 'إشعارات أندرويد');
K('Autorisées · touchez pour gérer dans Android', 'Allowed · tap to manage in Android', 'مسموحة · المس للإدارة في أندرويد');
K('Bloquées · touchez pour autoriser dans Android', 'Blocked · tap to allow in Android', 'محظورة · المس للسماح في أندرويد');
K('Écouter l’adhan', 'Listen to the adhan', 'استماع إلى الأذان');
K('Écouter', 'Play', 'استماع');
K('Arrêter', 'Stop', 'إيقاف');
K('Volume', 'Volume', 'مستوى الصوت');
K('Volume de l’adhan', 'Adhan volume', 'مستوى صوت الأذان');
K('Vibration', 'Vibration', 'الاهتزاز');
K('Au début de l’adhan', 'At the start of the adhan', 'عند بدء الأذان');
K('Test de l’adhan', 'Adhan test', 'اختبار الأذان');
K('Touchez ou balayez la notification pour couper le son', 'Tap or swipe the notification to stop the sound', 'المس الإشعار أو اسحبه لإيقاف الصوت');
K('Tester maintenant', 'Test now', 'اختبار الآن');
K('Adhan en cours…', 'Adhan playing…', 'الأذان قيد التشغيل…');
K('Vérifie que le téléphone sonne bien', 'Checks that the phone rings properly', 'يتأكد من أن الهاتف يصدر الصوت');
K('Récitateur', 'Reciter', 'القارئ');
K('À propos, sources et licences', 'About, sources and licences', 'حول التطبيق والمصادر والتراخيص');
K('Version {0} · aucune publicité, aucun compte', 'Version {0} · no ads, no account', 'الإصدار {0} · بلا إعلانات ولا حساب');
K('Position mise à jour.', 'Location updated.', 'تم تحديث الموقع.');
K('Position indisponible : autorisez la localisation.', 'Location unavailable: allow location access.', 'الموقع غير متاح: اسمح بالوصول إلى الموقع.');
K('Lecture impossible.', 'Playback failed.', 'تعذّر التشغيل.');

/* ---- Calendrier ---- */
K('Aujourd’hui', 'Today', 'اليوم');
K('Mois précédent', 'Previous month', 'الشهر السابق');
K('Mois suivant', 'Next month', 'الشهر التالي');
K('Vendredi, prière de Joumou‘a · petits chiffres : jour hégirien', 'Friday, Jumu‘ah prayer · small numbers: Hijri day', 'الجمعة، صلاة الجمعة · الأرقام الصغيرة: اليوم الهجري');
K('Horaires du jour sélectionné', 'Times for the selected day', 'مواقيت اليوم المحدد');

/* ---- Qibla ---- */
K('Boussole', 'Compass', 'البوصلة');
K('Heures', 'Clocks', 'الساعات');
K('La Mecque', 'Mecca', 'مكة المكرمة');
K('France', 'France', 'فرنسا');
K('N', 'N', 'ش'); K('E', 'E', 'شر'); K('S', 'S', 'ج'); K('O', 'W', 'غ');
['Nord', 'Nord-Nord-Est', 'Nord-Est', 'Est-Nord-Est', 'Est', 'Est-Sud-Est', 'Sud-Est', 'Sud-Sud-Est', 'Sud', 'Sud-Sud-Ouest', 'Sud-Ouest', 'Ouest-Sud-Ouest', 'Ouest', 'Ouest-Nord-Ouest', 'Nord-Ouest', 'Nord-Nord-Ouest'].forEach((d, i) => {
  K(d, ['North', 'North-northeast', 'Northeast', 'East-northeast', 'East', 'East-southeast', 'Southeast', 'South-southeast', 'South', 'South-southwest', 'Southwest', 'West-southwest', 'West', 'West-northwest', 'Northwest', 'North-northwest'][i],
    ['شمال', 'شمال شمال شرق', 'شمال شرق', 'شرق شمال شرق', 'شرق', 'شرق جنوب شرق', 'جنوب شرق', 'جنوب جنوب شرق', 'جنوب', 'جنوب جنوب غرب', 'جنوب غرب', 'غرب جنوب غرب', 'غرب', 'غرب شمال غرب', 'شمال غرب', 'شمال شمال غرب'][i]);
});
K('Recherche du nord… bougez le téléphone en dessinant un 8.', 'Looking for north… move the phone in a figure 8.', 'جارٍ البحث عن الشمال… حرّك الهاتف على شكل الرقم 8.');
K('Vous faites face à la Qibla.', 'You are facing the Qibla.', 'أنت متجه نحو القبلة.');
K('Tournez de {0}° vers la droite.', 'Turn {0}° to the right.', 'استدر {0}° نحو اليمين.');
K('Tournez de {0}° vers la gauche.', 'Turn {0}° to the left.', 'استدر {0}° نحو اليسار.');
K(' · heure d’hiver', ' · winter time', ' · التوقيت الشتوي');
K(' · heure d’été', ' · summer time', ' · التوقيت الصيفي');
K('Tenez le téléphone à plat et éloignez-le des objets métalliques ou aimantés.', 'Hold the phone flat and keep it away from metal or magnetic objects.', 'امسك الهاتف أفقيًا وأبعده عن الأجسام المعدنية أو المغناطيسية.');

/* ---- Coran ---- */
K('Mecquoise', 'Meccan', 'مكية');
K('Médinoise', 'Medinan', 'مدنية');
K('{0} verset', '{0} verse', '{0} آية');
K('{0} versets', '{0} verses', '{0} آية');
K('114 sourates · texte arabe et traduction française', '114 surahs · Arabic text and English translation', '114 سورة · النص العربي والترجمة الفرنسية');
K('Rechercher une sourate', 'Search for a surah', 'ابحث عن سورة');
K('Sourates', 'Surahs', 'السور');
K('Juz’', 'Juz’', 'الأجزاء');
K('Marque-pages', 'Bookmarks', 'العلامات');
K('Impossible de charger le texte du Coran.', 'Unable to load the Quran text.', 'تعذّر تحميل نص القرآن.');
K('Reprendre la lecture', 'Resume reading', 'متابعة القراءة');
K('{0} · verset {1}', '{0} · verse {1}', '{0} · الآية {1}');
K('Juz’ {0}', 'Juz’ {0}', 'الجزء {0}');
K('{0}, verset {1}', '{0}, verse {1}', '{0}، الآية {1}');
K('Marque-page', 'Bookmark', 'علامة');
K('Versets', 'Verses', 'الآيات');
K('Aucun marque-page. Touchez le marque-page en haut d’une sourate, ou celui d’un verset.', 'No bookmarks. Tap the bookmark at the top of a surah, or the one on a verse.', 'لا توجد علامات. المس العلامة أعلى السورة أو علامة الآية.');
K('Aucun résultat.', 'No results.', 'لا توجد نتائج.');
K('Chargement de la sourate…', 'Loading the surah…', 'جارٍ تحميل السورة…');
K('Refermer la note', 'Close the note', 'إغلاق الملاحظة');
K('Refermer', 'Close', 'إغلاق');
K('Verset {0}', 'Verse {0}', 'الآية {0}');
K('Écouter le verset {0}', 'Listen to verse {0}', 'استماع إلى الآية {0}');
K('Marque-page, verset {0}', 'Bookmark, verse {0}', 'علامة، الآية {0}');
K('Notes du verset {0}', 'Notes for verse {0}', 'ملاحظات الآية {0}');
K('Notes', 'Notes', 'ملاحظات');
K('Retour à la liste des sourates', 'Back to the list of surahs', 'العودة إلى قائمة السور');
K('Sourate {0}', 'Surah {0}', 'السورة {0}');
K('Retirer la sourate des marque-pages', 'Remove the surah from bookmarks', 'إزالة السورة من العلامات');
K('Ajouter la sourate aux marque-pages', 'Add the surah to bookmarks', 'إضافة السورة إلى العلامات');
K('Taille du texte', 'Text size', 'حجم الخط');
K('Traduction', 'Translation', 'الترجمة (الفرنسية)');
K('Récitation : {0}', 'Recitation: {0}', 'التلاوة: {0}');
K('Texte de la sourate', 'Text of the surah', 'نص السورة');
K('Texte arabe : Tanzil.net (licence CC BY 3.0). Traduction : Dr Nabil Rudwan, Noor International Center, via QuranEnc.com. ', 'Arabic text: Tanzil.net (CC BY 3.0 licence). Translation: Dr Nabil Rudwan, Noor International Center, via QuranEnc.com. ', 'النص العربي: Tanzil.net (رخصة CC BY 3.0). الترجمة: د. نبيل رضوان، مركز نور الدولي، عبر QuranEnc.com. ');
K('Texte arabe : Tanzil.net (licence CC BY 3.0). Traduction anglaise : Noor International Center, via QuranEnc.com. ', 'Arabic text: Tanzil.net (CC BY 3.0 licence). English translation: Noor International Center, via QuranEnc.com. ', '');
K('Détails', 'Details', 'التفاصيل');
K('Sourate ajoutée aux marque-pages.', 'Surah added to bookmarks.', 'أُضيفت السورة إلى العلامات.');
K('Sourate retirée des marque-pages.', 'Surah removed from bookmarks.', 'أُزيلت السورة من العلامات.');
K('Marque-page ajouté.', 'Bookmark added.', 'أُضيفت العلامة.');
K('Marque-page retiré.', 'Bookmark removed.', 'أُزيلت العلامة.');
K('Fin de la sourate.', 'End of the surah.', 'نهاية السورة.');
K('Récitation indisponible : vérifiez la connexion Internet.', 'Recitation unavailable: check your Internet connection.', 'التلاوة غير متاحة: تحقق من اتصال الإنترنت.');
K('Récitation', 'Recitation', 'التلاوة');
K('Mettre en pause la récitation', 'Pause the recitation', 'إيقاف التلاوة مؤقتًا');
K('Lancer la récitation', 'Start the recitation', 'بدء التلاوة');
K('Verset {0} sur {1}', 'Verse {0} of {1}', 'الآية {0} من {1}');
K('Touchez ▶ pour écouter', 'Tap ▶ to listen', 'المس ▶ للاستماع');
K('Verset précédent', 'Previous verse', 'الآية السابقة');
K('Verset suivant', 'Next verse', 'الآية التالية');
K('Arrêter la récitation', 'Stop the recitation', 'إيقاف التلاوة');

/* ---- À propos ---- */
K('À propos', 'About', 'حول التطبيق');
K('<b>Salah Compass</b> · version {0}. Application gratuite, sans publicité, sans compte et sans collecte de données. Vos réglages et votre position restent sur votre téléphone.',
  '<b>Salah Compass</b> · version {0}. Free app, no ads, no account and no data collection. Your settings and your location stay on your phone.',
  '<b>Salah Compass</b> · الإصدار {0}. تطبيق مجاني بلا إعلانات ولا حساب ولا جمع للبيانات. تبقى إعداداتك وموقعك على هاتفك.');
K('Horaires de prière', 'Prayer times', 'مواقيت الصلاة');
K('Calculés sur l’appareil à partir de votre position, selon la méthode choisie dans les réglages. Ils peuvent différer de quelques minutes de ceux de votre mosquée : en cas de doute, suivez les horaires de votre mosquée.',
  'Calculated on the device from your location, using the method chosen in settings. They may differ by a few minutes from those of your mosque: if in doubt, follow your mosque’s times.',
  'تُحسب على الجهاز اعتمادًا على موقعك وبالطريقة المختارة في الإعدادات. قد تختلف بضع دقائق عن مواقيت مسجدك: عند الشك اتبع مواقيت مسجدك.');
K('Texte du Coran', 'Quran text', 'نص القرآن');
K('Texte arabe (écriture ‘uthmani) : projet', 'Arabic text (‘Uthmani script): project', 'النص العربي (الرسم العثماني): مشروع');
K('Traduction française', 'French translation', 'الترجمة الفرنسية');
K('Traduction anglaise', 'English translation', 'الترجمة الإنجليزية');
K('Traduction publiée par le Noor International Center (version 1.1.2), fournie par {0}. Le texte et les notes de la traduction sont affichés sans modification (seul le numéro de verset placé en tête de chaque verset est retiré à l’affichage, puisqu’il apparaît déjà dans le médaillon).', 'Translation published by the Noor International Center (version 1.1.2), provided by {0}. The text and notes of the translation are displayed unmodified (only the verse number at the start of each verse is hidden, since it already appears in the medallion).', '');
K('Traduction du Dr Nabil Rudwan, publiée par le Noor International Center (version 1.0.0), fournie par {0}. Le texte et les notes de la traduction sont affichés sans modification (seul le numéro de verset placé en tête de chaque verset est retiré à l’affichage, puisqu’il apparaît déjà dans le médaillon).',
  'Translation by Dr Nabil Rudwan, published by the Noor International Center (version 1.0.0), provided by {0}. The text and notes of the translation are displayed unmodified (only the verse number at the start of each verse is hidden, since it already appears in the medallion).',
  'ترجمة د. نبيل رضوان، نشرها مركز نور الدولي (الإصدار 1.0.0)، وتوفّرها {0}. يُعرض نص الترجمة وملاحظاتها دون تعديل (يُحذف فقط رقم الآية في بداية كل آية لأنه ظاهر في الدائرة).');
K('Les récitations verset par verset sont lues en ligne depuis {0}. Elles ne sont pas copiées dans l’application et nécessitent une connexion Internet. Les droits appartiennent aux récitateurs.',
  'The verse-by-verse recitations are streamed online from {0}. They are not copied into the app and require an Internet connection. Rights belong to the reciters.',
  'تُشغَّل التلاوات آيةً آيةً عبر الإنترنت من {0}. وهي غير منسوخة داخل التطبيق وتحتاج إلى اتصال بالإنترنت. الحقوق محفوظة للقرّاء.');
K('Fichier audio fourni par l’utilisateur de l’application.', 'Audio file provided by the user of the app.', 'ملف صوتي وفّره مستخدم التطبيق.');
K('Données utilisées', 'Data used', 'البيانات المستخدمة');
K('Mise en forme des données du Coran : projet {0} (CC BY-SA 4.0).', 'Formatting of the Quran data: project {0} (CC BY-SA 4.0).', 'تنسيق بيانات القرآن: مشروع {0} (CC BY-SA 4.0).');

/* ---- Éléments statiques de la page ---- */
document.title = 'Salah Compass';
(function () {
  const p = document.getElementById('player'); if (p) p.setAttribute('aria-label', tr('Récitation'));
  const n = document.getElementById('nav'); if (n) n.setAttribute('aria-label', tr('Navigation principale'));
})();
