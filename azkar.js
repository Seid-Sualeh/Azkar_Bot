










// ===================================
// ☀️ أذكار الصباح (MORNING AZKAR) - عربي / إنجليزي / أمهرية
// ===================================

const morningAzkar = [
  // 1. آية الكرسي (من القرآن)
  {
    arabic: `أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ. اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ.`,
    english: `Ayat Al-Kursi (Quran 2:255). Allah! There is no god but He, the Living, the Sustainer. Neither slumber nor sleep overtakes Him. To Him belongs whatever is in the heavens and whatever is on the earth. Who is there that can intercede with Him except by His permission? He knows what is [presently] before them and what will be after them, and they encompass not a thing of His knowledge except for what He wills. His Kursi extends over the heavens and the earth, and their preservation tires Him not. And He is the Most High, the Most Great.`,
    amharic: `አላህ ከርሱ በቀር ሌላ አምላክ የለም። ሕያው፣ ጸንቶ ቆሚ ነው። ማንገላጀትም እንቅልፍም አይይዘውም። በሰማያትና በምድር ያለው ሁሉ የእርሱ ነው። በፈቃዱ ቢኾን እንጅ እርሱ ዘንድ የሚያማልድ ማነው? ከፊታቸው ያለውንና ከኋላቸው ያለውንም ያውቃል። ከዕውቀቱም በሻው እንጂ በምንም ነገር አያውቁም። ወንበሩ ሰማያትንና ምድርን ሰፋ። የእነሱንም ጥበቃ አያቅተውም። እርሱም የበላይ ታላቅ ነው።`,
    repetitions: 1,
    source: "من القرآن الكريم (سورة البقرة: 255)",
  },
  // 2. المعوذات (الإخلاص، الفلق، الناس)
  {
    arabic: `قراءة سورة الإخلاص، وسورة الفلق، وسورة الناس.`,
    english: `Recitation of Surah Al-Ikhlas, Surah Al-Falaq, and Surah An-Nas.`,
    amharic: `ሱረቱል ኢኽላስን፣ ሱረቱል ፈለቅንና ሱረቱል ናስን መቅራት።`,
    repetitions: 3,
    source: "من السنة النبوية (حديث)",
  },
  // 3. سيّد الاستغفار
  {
    arabic: `اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ.`,
    english: `Sayyid al-Istighfar: O Allah, You are my Lord; there is no deity except You. You created me, and I am Your servant. I am abiding by Your covenant and promise as much as I can. I seek refuge in You from the evil of what I have done. I acknowledge Your favor upon me, and I acknowledge my sin. So forgive me, for none forgives sins except You.`,
    amharic: `አላህ ሆይ! አንተ ጌታዬ ነህ፤ ከአንተ በቀር ሌላ አምላክ የለም። ፈጥረኸኛል፣ እኔም ባሪያህ ነኝ። በቻልኩት ሁሉ በቃል ኪዳንህና በውዴታህ ላይ ነኝ። ከሠራሁት ነገር ክፋት በአንተ እጠበቃለሁ። በእኔ ላይ ያለችውን ፀጋህን እቀበላለሁ፣ ኃጢአቴንም እቀበላለሁና ማረኝ። ከአንተ ሌላ ኃጢአትን የሚምር የለምና።`,
    repetitions: 1,
    source: "من السنة النبوية (حديث)",
  },
  // 4. دعاء أصبحت/أمسيت
  {
    arabic: `أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ. رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ، وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ.`,
    english: `We have entered the morning and at this very time, the whole kingdom belongs to Allah, and all praise is for Allah. There is no deity except Allah, alone, without partner. To Him belongs all sovereignty and all praise, and He is over all things capable. My Lord, I ask You for the good of this day and what follows it, and I seek refuge in You from the evil of this day and what follows it...`,
    amharic: `አምሽተናል፤ ንግስናውም ለአላህ ነው። ከአላህ በስተቀር ሌላ አምላክ የለም፤ ንግስናም የእርሱ ነው። ጌታዬ ሆይ! የዚህን ቀን መልካምነት እና ከእርሱ በኋላ ያለውን መልካምነት እጠይቅሃለሁ። ከዚህ ቀን ክፋት እና ከእርሱ በኋላ ካለው ክፋት በአንተ እጠበቃለሁ።`,
    repetitions: 1,
    source: "من السنة النبوية (حديث)",
  },
  // 5. دعاء اللهم بك أصبحنا
  {
    arabic: `اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ.`,
    english: `O Allah, by You we enter the morning, and by You we enter the evening, and by You we live, and by You we die, and to You is the resurrection.`,
    amharic: `አላህ ሆይ! በአንተ አውግተናል፤ በአንተ አምሽተናል፤ በአንተ እንኖራለን፤ በአንተ እንሞታለን፤ መነሣትም ወደ አንተ ነው።`,
    repetitions: 1,
    source: "من السنة النبوية (حديث)",
  },
  // 6. طلب العافية الشاملة
  {
    arabic: `اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي، اللَّهُمَّ اسْتُرْ عَوْرَاتِي، وَآمِنْ رَوْعَاتِي، اللَّهُمَّ احْفَظْنِي مِنْ بَيْنِ يَدَيَّ وَمِنْ خَلْفِي وَعَنْ يَمِينِي وَعَنْ شِمَالِي وَمِنْ فَوْقِي، وَأَعُوذُ بِعَظَمَتِكَ أَنْ أُغْتَالَ مِنْ تَحْتِي.`,
    english: `O Allah, I ask You for pardon and well-being in this world and the Hereafter. O Allah, I ask You for pardon and well-being in my religion, my worldly affairs, my family, and my property. O Allah, shield my flaws and secure my fears. O Allah, protect me from before me and behind me, from my right and my left, and from above me, and I seek refuge in Your Greatness from being unexpectedly assaulted from below me.`,
    amharic: `አላህ ሆይ! በዚህ ዓለምም ሆነ በመጨረሻው ዓለም ምህረትንና ጤንነትን እጠይቅሃለሁ። አላህ ሆይ! በሃይማኖቴ፣ በዱንያዬ፣ በቤተሰቤና በንብረቴ ምህረትንና ጤንነትን እጠይቅሃለሁ። አላህ ሆይ! ነውሬን ሸፍንልኝ፣ ፍርሀቶቼን አስታግስልኝ። አላህ ሆይ! ከፊቴ፣ ከኋላዬ፣ ከቀኜ፣ ከግራዬ፣ ከላዬም ጠብቀኝ፤ ከታችም በኩል ባንተ ታላቅነት እጠበቃለሁ።`,
    repetitions: 1,
    source: "من السنة النبوية (حديث)",
  },
  // 7. التحصين والتوكل
  {
    arabic: `بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ.`,
    english: `In the name of Allah, with whose name nothing on earth or in the heavens can cause harm, and He is the All-Hearing, the All-Knowing.`,
    amharic: `በአላህ ስም፤ በስሙ ምክንያት በምድርም ሆነ በሰማይ ምንም ነገር የማይጎዳ (አምላክ)፤ እርሱም ሁሉን ሰሚና ሁሉን ዐዋቂ ነው።`,
    repetitions: 3,
    source: "من السنة النبوية (حديث)",
  },
  // 8. الرضا والحمد
  {
    arabic: `رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا.`,
    english: `I am pleased with Allah as my Lord, with Islam as my religion, and with Muhammad ﷺ as my Prophet.`,
    amharic: `አላህን ጌታዬ በማድረግ፣ ኢስላምን ሃይማኖቴ በማድረግ፣ ሙሐመድንም ﷺ ነብዬ በማድረግ ተደስቻለሁ።`,
    repetitions: 3,
    source: "من السنة النبوية (حديث)",
  },
  // 9. الحمد على النعمة
  {
    arabic: `اللَّهُمَّ مَا أَصْبَحَ بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ.`,
    english: `O Allah, whatever blessing has come to me or any of Your creation this morning is from You alone. You have no partner. So for You is all praise and all thanks.`,
    amharic: `አላህ ሆይ! ዛሬ ጠዋት በእኔ ላይ ወይም ከፍጡሮችህ በአንዱ ላይ የደረሰ ማንኛውም ፀጋ ከአንተ ብቻ ነው። አንተም አጋር የለህም። ስለዚህ ምስጋና ለአንተ ብቻ ነው፤ ምስጋናም ለአንተ ይገባል።`,
    repetitions: 1,
    source: "من السنة النبوية (حديث)",
  },
  // 10. يَا حَيُّ يَا قَيُّومُ
  {
    arabic: `يَا حَيُّ يَا قَيُّومُ، بِرَحْمَتِكَ أَسْتَغِيثُ، أَصْلِحْ لِي شَأْنِي كُلَّهُ، وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ.`,
    english: `O Ever-Living, O Sustainer, by Your mercy I seek help. Rectify all my affairs for me, and do not entrust me to myself for the blink of an eye.`,
    amharic: `አንተ ህያው የሆንክና ሁሉን ነገር ያቆምክ ጌታ ሆይ! በእዝነትህ እታገዛለሁ። ነገሬን ሁሉ አስተካክልልኝ፣ ለአይን ጥቅሻ ያህል እንኳ ለራሴ አትተወኝ።`,
    repetitions: 1,
    source: "من السنة النبوية (حديث)",
  },
  // 11. التوحيد (100 مرة)
  {
    arabic: `لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ.`,
    english: `There is no deity except Allah alone, without partner. To Him belongs all sovereignty and all praise, and He is over all things capable.`,
    repetitions: 100,
    source: "من السنة النبوية (حديث)",
  },
  // 12. التسبيح (100 مرة)
  {
    arabic: `سُبْحَانَ اللهِ وَبِحَمْدِهِ.`,
    english: `Glory be to Allah and praise be to Him.`,
    amharic: `አላህ ጥራት ይገባውና ምስጋና ይገባው።`,
    repetitions: 100,
    source: "من السنة النبوية (حديث)",
  },
  // 13. التسبيح الخاص
  {
    arabic: `سُبْحَانَ اللهِ وَبِحَمْدِهِ عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ.`,
    english: `Glory be to Allah and praise Him, (as much as) the number of His creation, and according to His Pleasure, and by the weight of His Throne, and by the extent of His Words.`,
    amharic: `የፍጡራኑ ብዛት፣ የራሱ እርካታ፣ የዙፋኑ ክብደት፣ እና የቃላቶቹ ቀለም እኩል ሆኖ አላህን አወድሳለሁ።`,
    repetitions: 3,
    source: "من السنة النبوية (حديث)",
  },
];

// ===================================
// 🌙 أذكار المساء (EVENING AZKAR) - عربي / إنجليزي / أمهرية
// ===================================

const eveningAzkar = [
  // 1. آية الكرسي (من القرآن)
  {
    arabic: `أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ. اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ.`,
    english: `Ayat Al-Kursi (Quran 2:255). Allah! There is no god but He, the Living, the Sustainer. Neither slumber nor sleep overtakes Him...`,
    amharic: `አላህ ከርሱ በቀር ሌላ አምላክ የለም። ሕያው፣ ጸንቶ ቆሚ ነው። ማንገላጀትም እንቅልፍም አይይዘውም። በሰማያትና በምድር ያለው ሁሉ የእርሱ ነው።...`,
    repetitions: 1,
    source: "من القرآن الكريم (سورة البقرة: 255)",
  },
  // 2. المعوذات (الإخلاص، الفلق، الناس)
  {
    arabic: `قراءة سورة الإخلاص، وسورة الفلق، وسورة الناس.`,
    english: `Recitation of Surah Al-Ikhlas, Surah Al-Falaq, and Surah An-Nas.`,
    amharic: `ሱረቱል ኢኽላስን፣ ሱረቱል ፈለቅንና ሱረቱል ናስን መቅራት።`,
    repetitions: 3,
    source: "من السنة النبوية (حديث)",
  },
  // 3. سيّد الاستغفار
  {
    arabic: `اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ.`,
    english: `Sayyid al-Istighfar: O Allah, You are my Lord; there is no deity except You... So forgive me, for none forgives sins except You.`,
    amharic: `አላህ ሆይ! አንተ ጌታዬ ነህ፤ ከአንተ በቀር ሌላ አምላክ የለም። ፈጥረኸኛል፣ እኔም ባሪያህ ነኝ። ... ማረኝ። ከአንተ ሌላ ኃጢአትን የሚምር የለምና።`,
    repetitions: 1,
    source: "من السنة النبوية (حديث)",
  },
  // 4. دعاء اللهم بك أصبحنا
  {
    arabic: `اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ.`,
    english: `O Allah, by You we enter the evening, by You we enter the morning, by You we live, by You we die, and to You is our return.`,
    amharic: `አላህ ሆይ! በአንተ አምሽተናል፤ በአንተ አውግተናል፤ በአንተ እንኖራለን፤ በአንተ እንሞታለን፤ መመለሻችንም ወደ አንተ ነው።`,
    repetitions: 1,
    source: "من السنة النبوية (حديث)",
  },
  // 5. دعاء أمسينا وأمسى الملك لله
  {
    arabic: `أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ. رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذِهِ اللَّيْلَةِ وَخَيْرَ مَا بَعْدَهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذِهِ اللَّيْلَةِ وَشَرِّ مَا بَعْدَهَا، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ، وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ.`,
    english: `We have entered the evening and at this very time, the whole kingdom belongs to Allah, and all praise is for Allah. There is no deity except Allah, alone, without partner... My Lord, I ask You for the good of this night and what follows it, and I seek refuge in You from the evil of this night and what follows it...`,
    amharic: `አምሽተናል፤ ንግስናውም ለአላህ ነው። ከአላህ በስተቀር ሌላ አምላክ የለም፤ ንግስናም የእርሱ ነው። ጌታዬ ሆይ! የዚህን ሌሊት መልካምነት እና ከእርሱ በኋላ ያለውን መልካምነት እጠይቅሃለሁ...`,
    repetitions: 1,
    source: "من السنة النبوية (حديث)",
  },
  // 6. التحصين بكلمات الله التامات
  {
    arabic: `أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ.`,
    english: `I seek refuge in Allah's perfect words from the evil of what He has created.`,
    amharic: `ከተፈጠረው ክፋት ሁሉ፣ በአላህ ፍፁም ቃላት እጠበቃለሁ።`,
    repetitions: 3,
    source: "من السنة النبوية (حديث)",
  },
  // 7. إشهاد الملائكة
  {
    arabic: `اللَّهُمَّ إِنِّي أَمْسَيْتُ أُشْهِدُكَ وَأُشْهِدُ حَمَلَةَ عَرْشِكَ وَمَلَائِكَتَكَ وَجَمِيعَ خَلْقِكَ، أَنَّكَ أَنْتَ اللَّهُ لَا إِلَهَ إِلَّا أَنْتَ وَحْدَكَ لَا شَرِيكَ لَكَ، وَأَنَّ مُحَمَّدًا عَبْدُكَ وَرَسُولُكَ.`,
    english: `O Allah, this evening I bear witness to You, and I bear witness to the bearers of Your Throne, Your angels, and all Your creation, that indeed You are Allah, there is no deity except You, alone, without partner, and that Muhammad is Your servant and Your Messenger.`,
    amharic: `አላህ ሆይ! አንተን መስካሪ ሆኜ አምሽቻለሁ። የዐርሽህን ተሸካሚዎች፣ መላእክትህን እና ፍጡርህን ሁሉ አስመስክራለሁ። አንተ አላህ እንደሆንክ፣ ከአንተ በቀር አምላክ እንደሌለ፣ ብቻህን እንደሆንክ፣ አጋር እንደሌለህ፣ እና ሙሐመድም ባሪያህና መልዕክተኛህ እንደሆኑ።`,
    repetitions: 4,
    source: "من السنة النبوية (حديث)",
  },
  // 8. حسبنا الله
  {
    arabic: `حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ.`,
    english: `Allah is sufficient for me; there is no deity except Him. I place my trust in Him, and He is the Lord of the Mighty Throne.`,
    repetitions: 7,
    source: "من القرآن الكريم (سورة التوبة: 129) ومن السنة النبوية (حديث)",
  },
  // 9. طلب العافية الشاملة
  {
    arabic: `اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي، اللَّهُمَّ اسْتُرْ عَوْرَاتِي، وَآمِنْ رَوْعَاتِي، اللَّهُمَّ احْفَظْنِي مِنْ بَيْنِ يَدَيَّ وَمِنْ خَلْفِي وَعَنْ يَمِينِي وَعَنْ شِمَالِي وَمِنْ فَوْقِي، وَأَعُوذُ بِعَظَمَتِكَ أَنْ أُغْتَالَ مِنْ تَحْتِي.`,
    english: `O Allah, I ask You for pardon and well-being in this world and the Hereafter. O Allah, I ask You for pardon and well-being in my religion, my worldly affairs, my family, and my property... O Allah, protect me from before me and behind me, from my right and my left, and from above me, and I seek refuge in Your Greatness from being unexpectedly assaulted from below me.`,
    repetitions: 1,
    source: "من السنة النبوية (حديث)",
  },
  // 10. طلب العافية الجسدية
  {
    arabic: `اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَهَ إِلَّا أَنْتَ. اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْكُفْرِ وَالْفَقْرِ، وَأَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ، لَا إِلَهَ إِلَّا أَنْتَ.`,
    english: `O Allah, grant health to my body, my hearing, and my sight. There is no deity except You. O Allah, I seek refuge in You from disbelief and poverty, and I seek refuge in You from the punishment of the grave. There is no deity except You.`,
    amharic: `አላህ ሆይ! በሰውነቴ ጤንነትን ስጠኝ። በመስማቴ ጤንነትን ስጠኝ። በማየቴ ጤንነትን ስጠኝ። ከአንተ ሌላ አምላክ የለም። ከክህደትና ከድህነት በአንተ እጠበቃለሁ...`,
    repetitions: 3,
    source: "من السنة النبوية (حديث)",
  },
  // 11. يا حي يا قيوم
  {
    arabic: `يَا حَيُّ يَا قَيُّومُ، بِرَحْمَتِكَ أَسْتَغِيثُ، أَصْلِحْ لِي شَأْنِي كُلَّهُ، وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ.`,
    english: `O Ever-Living, O Sustainer, by Your mercy I seek help. Rectify all my affairs for me, and do not entrust me to myself for the blink of an eye.`,
    amharic: `አንተ ህያው የሆንክና ሁሉን ነገር ያቆምክ ጌታ ሆይ! በእዝነትህ እታገዛለሁ። ነገሬን ሁሉ አስተካክልልኝ፣ ለአይን ጥቅሻ ያህል እንኳ ለራሴ አትተወኝ።`,
    repetitions: 1,
    source: "من السنة النبوية (حديث)",
  },
  // 12. التسبيح (100 مرة)
  {
    arabic: `سُبْحَانَ اللهِ وَبِحَمْدِهِ.`,
    english: `Glory be to Allah and praise be to Him.`,
    amharic: `አላህ ጥራት ይገባውና ምስጋና ይገባው።`,
    repetitions: 100,
    source: "من السنة النبوية (حديث)",
  },
  // 13. الصلاة على النبي (إضافة)
  {
    arabic: `اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ.`,
    english: `O Allah, send Your blessings and peace upon our Prophet Muhammad ﷺ.`,
    amharic: `አላህ ሆይ! በነብያችን ሙሐመድ ላይ ሰላምና ፀጋህን አውርድ።`,
    repetitions: 10,
    source: "من السنة النبوية (حديث)",
  },
  // 14. التحصين من الوسوسة (إضافة)
  {
    arabic: `أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّةِ مِنْ كُلِّ شَيْطَانٍ وَهَامَّةٍ وَمِنْ كُلِّ عَيْنٍ لَامَّةٍ.`,
    english: `I seek refuge in the perfect words of Allah from every devil and evil creature, and from every evil eye.`,
    amharic: `ከእያንዳንዱ ሰይጣንና አውሬ እንዲሁም ከእያንዳንዱ አድማጭ ዓይን በአላህ ፍፁም ቃላት እጠበቃለሁ።`,
    repetitions: 1,
    source: "من السنة النبوية (حديث)",
  },
];

// ===================================
// EXPORT
// ===================================
module.exports = { morningAzkar, eveningAzkar };