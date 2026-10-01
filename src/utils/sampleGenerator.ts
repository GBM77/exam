import JSZip from 'jszip';

export interface SampleExamConfig {
  title: string;
  subtitle: string;
  subject: string;
  grade: string;
  timeLimit: string;
  markAnswerInRed?: boolean; // If true, questions have blank bracket (   ) and correct answer is marked in RED font
  questions: {
    stem: string;
    options: string[];
    answer: string; // 'A', 'B', 'C', 'D'
    explanation?: string;
    layout?: 'paragraph' | 'inline';
  }[];
}

export const SAMPLE_EXAMS: Record<string, SampleExamConfig> = {
  redMark: {
    title: '臺北市立示範高級中學 114 學年度 自然與社會科 教師出題卷',
    subtitle: '素養整合評量（原卷題前為空白括號 (   )，正解直接以紅字標示於選項）',
    subject: '自然與生活科技 (紅字標記卷)',
    grade: '高一',
    timeLimit: '50 分鐘',
    markAnswerInRed: true,
    questions: [
      {
        stem: '在進行光合作用實驗時，使用碘液檢驗葉片中所含的養分，若葉片呈藍黑色，代表葉片中含有何種物質？',
        options: [
          '葡萄糖（單醣水溶液）',
          '澱粉（植物儲存的主要多醣）',
          '葉綠素（植物進行光合作用之色素）',
          '蛋白質（細胞膜主要構造物質）'
        ],
        answer: 'B',
        layout: 'paragraph'
      },
      {
        stem: '關於板塊構造學說與臺灣的地質構造，下列哪一項敘述完全正確？',
        options: [
          '臺灣本島完全位於歐亞大陸板塊內部，屬於穩定無地震之地塊',
          '中央山脈與雪山山脈主要因菲律賓海板塊向西北隱沒推擠歐亞板塊而隆起',
          '大西洋中洋脊的擴張直接推動臺灣東部的地殼變動',
          '花東縱谷是臺灣地表唯一沒有斷層活動的安靜裂谷'
        ],
        answer: 'B',
        layout: 'paragraph'
      },
      {
        stem: '依據牛頓運動定律，當太空船於無重力且真空的深太空關閉推進引擎後，太空船將會呈現何種運動狀態？',
        options: [
          '立刻完全靜止不再前進',
          '繼續以等速度沿直線方向向前滑行',
          '受到宇宙射線阻力而呈現等加速度減速運動',
          '開始沿著附近的行星軌道作逆時針螺旋旋轉'
        ],
        answer: 'B',
        layout: 'inline'
      },
      {
        stem: '下列關於日常生活中的化學物質酸鹼度（pH 值在 25°C 下），何者屬於弱鹼性溶液？',
        options: [
          '胃酸（主要成分為稀鹽酸，pH 約 1.5～2.0）',
          '純檸檬原汁（富含檸檬酸，pH 約 2.5）',
          '純水（中性液體，pH 等於 7.0）',
          '小蘇打水溶液（碳酸氫鈉，pH 約 8.3）'
        ],
        answer: 'D',
        layout: 'paragraph'
      },
      {
        stem: '在生態系的物質循環與能量流動中，關於「能量金字塔」的特性，下列敘述何者正確？',
        options: [
          '能量在各個營養階層間可以 100% 完全無耗損地轉移',
          '通常由一個營養階層傳遞到下一個階層時，約僅有 10% 能量被利用',
          '最高級消費者所擁有的總能量必定大於基層生產者的總能量',
          '能量可以在各營養階層之間反覆循環再利用，不會散失至太空'
        ],
        answer: 'B',
        layout: 'paragraph'
      },
      {
        stem: '閱讀下述情境：臺灣夏季經常受到太平洋高氣壓籠罩，造成午後對流旺盛。下列哪一種降雨型態最符合臺灣夏季午後常見的「西北雨」？',
        options: [
          '鋒面雨（冷暖氣團交會抬升所致）',
          '地形雨（濕潤氣流遇高山背風坡下沉所致）',
          '對流雨（地面受強烈日照加熱，暖空氣急遽上升冷卻凝結成雨）',
          '颱風雨（強烈熱帶氣旋逆時針環流所致）'
        ],
        answer: 'C',
        layout: 'inline'
      }
    ]
  },
  comprehensive: {
    title: '臺北市立示範高級中學 114 學年度第一學期 第一次學科能力測驗',
    subtitle: '國語文與社會領域 素養綜合模擬試題卷',
    subject: '國文與社會',
    grade: '高一',
    timeLimit: '60 分鐘',
    questions: [
      {
        stem: '下列「」中的成語，何者使用最為恰當且符合語意脈絡？',
        options: [
          '他在學術界沉潛多年，如今終於「首當其沖」，獲頒諾貝爾榮譽獎項',
          '這兩位企業家在經營理念上「南轅北轍」，因而決定各自開創新的品牌',
          '面對突如其來的嚴峻疫情，醫療人員無不「休戚相關」，堅守防疫最前線',
          '小明準備考試總是不求甚解，甚至「宵衣旰食」，荒廢了平日的學業'
        ],
        answer: 'B',
        explanation: '「南轅北轍」比喻行動和目的正好相反，或彼此意圖互不相符。A應為「脫穎而出」；C應為「風雨同舟」；D宵衣旰食形容勤於公事，不合句意。',
        layout: 'paragraph'
      },
      {
        stem: '在氣候變遷因應策略中，臺灣於2050年欲達成「淨零排放」目標，下列何項政策最不可能被列為核心支柱？',
        options: [
          '全面重啟大型燃煤發電機組以降低電力生產成本',
          '擴大推動屋頂型與地面型太陽光電及離岸風力發電建置',
          '推動綠色建築標章與全面提升產業智慧節能效率',
          '發展氫能等前瞻低碳能源以及加速碳捕捉再利用封存（CCUS）技術'
        ],
        answer: 'A',
        explanation: '重啟燃煤發電會大幅增加碳排放，與淨零目標完全背道而馳。',
        layout: 'paragraph'
      },
      {
        stem: '詩人蘇軾在〈赤壁賦〉中感嘆「寄蜉蝣於天地，渺滄海之一粟」，這句話表現出作者對生命的何種體悟？',
        options: [
          '對官場汲營名利的極致渴望與功成名就的追求',
          '對個人微小如芥子與天地永恆博大之間的深刻省思',
          '對年華老去、英雄無用武之地的憤世嫉俗',
          '對隱居田園、不問世事之出世無為思想的批判'
        ],
        answer: 'B',
        explanation: '寄蜉蝣、渺滄海皆以極小之物比擬人生之短暫與渺小，反襯天地浩瀚。',
        layout: 'paragraph'
      },
      {
        stem: '依據中華民國《憲法》及相關法律，關於「中央政府五院」體制之運作，下列敘述何者正確？',
        options: [
          '行政院得向立法院提出法律案、預算案與戒嚴案',
          '立法院得對司法院院長提出不信任案（倒閣案）',
          '監察院為國家最高審判機關，掌理民事刑事行政訴訟',
          '考試院掌理公務員之懲戒審判與罷免事宜'
        ],
        answer: 'A',
        explanation: '立法院僅得對行政院院長提出不信任案；最高審判機關為司法院；公務員懲戒由懲戒法院（司法院）掌理。',
        layout: 'paragraph'
      },
      {
        stem: '下列各組文句中，何者「」內的字詞前後意義完全相同？',
        options: [
          '師者，「所以」傳道受業解惑也 ／ 此先漢「所以」興隆也',
          '肉食者謀之，「又」何間焉 ／ 吾恂恂而起，視其缶，而吾蛇「又」在也',
          '非我也，兵「也」 ／ 蓮之愛，同予者「何人」',
          '不求「甚」解 ／ 傲物則骨肉為行路，況我「甚」少恩'
        ],
        answer: 'A',
        explanation: '兩者皆為「用來…的原因」之意。',
        layout: 'paragraph'
      },
      {
        stem: '當中央銀行採取「調升重貼現率與存款準備率」之緊縮性貨幣政策時，對市場資金之預期影響為何？',
        options: [
          '促使商業銀行大幅降低放款利率以刺激投資',
          '導致市場流通之資金量減少，有助於平抑通貨膨脹壓力',
          '推動民間消費意願劇增，帶動房地產價格急遽上揚',
          '使外資迅速自本國流出，促使本國貨幣立即大幅貶值'
        ],
        answer: 'B',
        explanation: '緊縮性貨幣政策收回市場資金、提高借貸利率，抑制物價通膨。',
        layout: 'inline'
      },
      {
        stem: '閱讀下列文句：「居天下之廣居，立天下之正位，行天下之大道。得志，與民由之；不得志，獨行其道。」此言論最能體現先秦哪一位思想家的核心人格理想？',
        options: [
          '莊子之逍遙自適',
          '韓非之法術勢結合',
          '孟子之大丈夫精神',
          '墨子之兼愛非攻'
        ],
        answer: 'C',
        explanation: '出自《孟子·滕文公下》，論「富貴不能淫，貧賤不能移，威武不能屈，此之謂大丈夫」。',
        layout: 'inline'
      },
      {
        stem: '地理資訊系統（GIS）在防災應變中心廣泛應用，若欲掌握土石流潛勢溪流下游受災保全戶之分佈與疏散路徑，最適合運用下列哪兩項分析功能？',
        options: [
          '環域分析（Buffer）與最佳路徑分析（Network Analysis）',
          '疊圖分析（Overlay）與遙測光譜反射率分析',
          '視域分析（Viewshed）與數位地形開挖回填計算',
          '克里金內插法（Kriging）與衛星雲圖氣壓場預報'
        ],
        answer: 'A',
        explanation: '環域分析劃定威脅半徑；路徑網路分析規劃最短安全疏散路線。',
        layout: 'paragraph'
      },
      {
        stem: '世界歷史上「啟蒙運動」（The Enlightenment）強調理性思辨與天賦人權，下列哪一部歷史重要文獻的思想淵源最直接深受其深刻影響？',
        options: [
          '1215年 英國《大憲章》（Magna Carta）',
          '1776年 美國《獨立宣言》（Declaration of Independence）',
          '1804年 法國《拿破崙法典》之封建貴族條款',
          '1648年 歐洲《西發里亞條約》（Peace of Westphalia）'
        ],
        answer: 'B',
        explanation: '傑佛遜起草《獨立宣言》深受洛克（John Locke）天賦人權與社會契約論影響。',
        layout: 'paragraph'
      },
      {
        stem: '下列哪一項文化現象最符合當代社會學所指稱之「文化涵化」（Acculturation）歷程？',
        options: [
          '臺灣原住民族群在與漢人社會長期互動中，逐漸發展出雙語與多元共融的生活型態',
          '某強勢帝國以武力強制禁止殖民地居民使用母語，進行徹底同化',
          '某傳統封閉部落完全拒絕與外界文明接觸，保持原始風貌',
          '不同國家的年輕人皆穿著相同品牌的牛仔褲與球鞋之單純流行'
        ],
        answer: 'A',
        explanation: '文化涵化係指不同文化群體持續直接接觸後，彼此文化特質所產生的變遷與調適。',
        layout: 'paragraph'
      },
      {
        stem: '詩句「總為浮雲能蔽日，長安不見使人愁」，作者借景抒情，其中「浮雲」通常象徵古典詩歌中的何種意象？',
        options: [
          '飄忽不定之游子鄉愁',
          '蒙蔽君王視聽之奸佞權臣',
          '難以捉摸之命運安排',
          '隱士超脫塵世之心境'
        ],
        answer: 'B',
        explanation: '「浮雲蔽日」在李白詩中常用以比喻奸臣蔽主，君臣相隔。',
        layout: 'inline'
      },
      {
        stem: '市場機制在完全競爭市場下透過「看不見的手」達成資源最適配置，下列何者會造成「市場失靈」（Market Failure）現象？',
        options: [
          '生產者自由進出市場且資訊完全公開透明',
          '工廠排放工業廢水未經處理導致外部成本由全民承擔',
          '消費者依個人效用偏好自主決定購買數量',
          '商品價格隨供需關係自主靈活浮動調整'
        ],
        answer: 'B',
        explanation: '外部性（如污染）未反映在商品價格上，造成資源配置扭曲，即為市場失靈。',
        layout: 'paragraph'
      }
    ]
  },
  english: {
    title: '國立示範女子高級中學 114學年度 英文科能力測驗',
    subtitle: 'English Comprehensive Examination - Multiple Choice Test',
    subject: '英文科 (English)',
    grade: '高中各年級',
    timeLimit: '45 分鐘',
    questions: [
      {
        stem: 'The research team made a ________ breakthrough that could lead to new treatments for various neurodegenerative diseases.',
        options: [
          'significant',
          'superficial',
          'monotonous',
          'reluctant'
        ],
        answer: 'A',
        explanation: 'significant 意為「重大的、顯著的」；superficial 膚淺的；monotonous 單調的；reluctant 勉強的。',
        layout: 'inline'
      },
      {
        stem: 'Due to severe weather conditions, the airport authorities decided to ________ all departing flights until tomorrow morning.',
        options: [
          'accelerate',
          'postpone',
          'exaggerate',
          'distribute'
        ],
        answer: 'B',
        explanation: 'postpone 意為「延期、推遲」符合天候惡劣停飛的語意。',
        layout: 'inline'
      },
      {
        stem: 'If she ________ the warning signs earlier, the unfortunate accident might have been completely avoided.',
        options: [
          'heeded',
          'had heeded',
          'would heed',
          'will have heeded'
        ],
        answer: 'B',
        explanation: '與過去事實相反的假設語氣：If + S + had + p.p., S + would/might + have + p.p.。',
        layout: 'inline'
      },
      {
        stem: 'The newly launched environmental campaign aims to raise public ________ of the dangers of microplastics in our oceans.',
        options: [
          'awareness',
          'hesitation',
          'coincidence',
          'fragility'
        ],
        answer: 'A',
        explanation: 'raise public awareness of... 為固定搭配，意為「喚起公眾對……的意識」。',
        layout: 'inline'
      },
      {
        stem: 'Unlike his outgoing twin brother, Timothy has always been quiet and rather ________ when meeting strangers.',
        options: [
          'reserved',
          'dynamic',
          'reckless',
          'prosperous'
        ],
        answer: 'A',
        explanation: 'reserved 形容人「靦腆、矜持、沈默寡言」，與 outgoing（外向）形成對比。',
        layout: 'inline'
      },
      {
        stem: 'Artificial intelligence is developing at an unprecedented pace, ________ both incredible opportunities and complex ethical dilemmas.',
        options: [
          'bringing about',
          'taking after',
          'looking down upon',
          'running out of'
        ],
        answer: 'A',
        explanation: 'bringing about 意為「帶來、引起」；taking after 貌似；running out of 用罄。',
        layout: 'paragraph'
      },
      {
        stem: 'The museum curator spent three months ________ restoring the ancient pottery discovered in the excavation site.',
        options: [
          'meticulously',
          'vaguely',
          'hastily',
          'aggressively'
        ],
        answer: 'A',
        explanation: 'meticulously 意為「一絲不苟地、極其仔細地」，符合修復珍貴古文物之語意。',
        layout: 'inline'
      },
      {
        stem: 'The documentary vividly illustrates how indigenous tribes have successfully ________ in harmony with nature for centuries.',
        options: [
          'coexisted',
          'collided',
          'conflicted',
          'condemned'
        ],
        answer: 'A',
        explanation: 'coexist in harmony with... 意為「與……和諧共存」。',
        layout: 'inline'
      }
    ]
  }
};

/**
 * Builds a valid, full-featured Microsoft Word (.docx) binary Blob
 * complete with styles, fonts, margins, header, and clean XML markup.
 */
export async function generateSampleDocxBlob(examKey: string = 'comprehensive'): Promise<{ blob: Blob; fileName: string }> {
  const config = SAMPLE_EXAMS[examKey] || SAMPLE_EXAMS.comprehensive;
  const zip = new JSZip();

  // 1. [Content_Types].xml
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
  <Override PartName="/word/fontTable.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml"/>
</Types>`
  );

  // 2. _rels/.rels
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  // 3. word/_rels/document.xml.rels
  zip.file(
    'word/_rels/document.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/>
</Relationships>`
  );

  // 4. word/settings.xml
  zip.file(
    'word/settings.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:zoom w:percent="100"/>
  <w:defaultTabStop w:val="720"/>
  <w:characterSpacingControl w:val="doNotCompress"/>
</w:settings>`
  );

  // 5. word/fontTable.xml
  zip.file(
    'word/fontTable.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:fontTable xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:font w:name="微軟正黑體">
    <w:panose1 w:val="020B0604030504040204"/>
    <w:charset w:val="88"/>
    <w:family w:val="swiss"/>
  </w:font>
  <w:font w:name="Times New Roman">
    <w:panose1 w:val="02020603050405020304"/>
    <w:charset w:val="00"/>
    <w:family w:val="roman"/>
  </w:font>
</w:fontTable>`
  );

  // 6. word/styles.xml
  zip.file(
    'word/styles.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:eastAsia="微軟正黑體" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
        <w:sz w:val="24"/>
        <w:szCs w:val="24"/>
        <w:lang w:val="zh-TW" w:eastAsia="zh-TW" w:bidi="ar-SA"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:line="360" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
</w:styles>`
  );

  // 7. word/document.xml
  const optionLetters = ['(A)', '(B)', '(C)', '(D)', '(E)'];
  let bodyXml = '';

  // Title
  bodyXml += `
  <w:p>
    <w:pPr>
      <w:jc w:val="center"/>
      <w:spacing w:before="120" w:after="60"/>
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:b/>
        <w:sz w:val="34"/>
        <w:szCs w:val="34"/>
      </w:rPr>
      <w:t>${escapeXml(config.title)}</w:t>
    </w:r>
  </w:p>
  <w:p>
    <w:pPr>
      <w:jc w:val="center"/>
      <w:spacing w:after="160"/>
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:b/>
        <w:sz w:val="28"/>
        <w:szCs w:val="28"/>
      </w:rPr>
      <w:t>${escapeXml(config.subtitle)}</w:t>
    </w:r>
  </w:p>`;

  // Exam Info Box
  bodyXml += `
  <w:p>
    <w:pPr>
      <w:pBdr>
        <w:bottom w:val="single" w:sz="8" w:space="4" w:color="000000"/>
        <w:top w:val="single" w:sz="8" w:space="4" w:color="000000"/>
      </w:pBdr>
      <w:jc w:val="both"/>
      <w:spacing w:before="60" w:after="120"/>
    </w:pPr>
    <w:r>
      <w:rPr><w:b/></w:rPr>
      <w:t>考試科目：${escapeXml(config.subject)}　｜　適用年級：${escapeXml(config.grade)}　｜　考試時間：${escapeXml(config.timeLimit)}　｜　班級：________ 座號：____ 姓名：___________</w:t>
    </w:r>
  </w:p>`;

  // Section Header
  bodyXml += `
  <w:p>
    <w:pPr>
      <w:spacing w:before="160" w:after="120"/>
    </w:pPr>
    <w:r>
      <w:rPr><w:b/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr>
      <w:t>一、單選題（共 ${config.questions.length} 題，每題 ${Math.round(100 / config.questions.length)} 分，請在題號前括弧內寫出正確答案）：</w:t>
    </w:r>
  </w:p>`;

  // Questions and Options
  config.questions.forEach((q, idx) => {
    const qNum = idx + 1;
    // If markAnswerInRed is true, question stem bracket is blank (   ), mimicking real teacher exam papers
    const answerMark = config.markAnswerInRed ? '(   )' : `( ${q.answer} )`;

    // Question paragraph
    bodyXml += `
  <w:p>
    <w:pPr>
      <w:spacing w:before="120" w:after="60"/>
      <w:ind w:left="420" w:hanging="420"/>
    </w:pPr>
    <w:r>
      <w:rPr><w:b/></w:rPr>
      <w:t xml:space="preserve">${answerMark} ${qNum}. </w:t>
    </w:r>
    <w:r>
      <w:t>${escapeXml(q.stem)}</w:t>
    </w:r>
  </w:p>`;

    if (q.layout === 'inline') {
      // All options in one single paragraph
      let inlineRuns = '';
      q.options.forEach((optText, optIdx) => {
        const letter = ['A', 'B', 'C', 'D', 'E'][optIdx];
        const isCorrectRed = config.markAnswerInRed && letter === q.answer;
        const colorVal = isCorrectRed ? 'FF0000' : '2B2B2B';
        const boldXml = isCorrectRed ? '<w:b/>' : '';
        inlineRuns += `
      <w:r>
        <w:rPr>${boldXml}<w:color w:val="${colorVal}"/></w:rPr>
        <w:t xml:space="preserve">${optionLetters[optIdx]} ${escapeXml(optText)}    </w:t>
      </w:r>`;
      });
      bodyXml += `
  <w:p>
    <w:pPr>
      <w:spacing w:before="40" w:after="80"/>
      <w:ind w:left="720"/>
    </w:pPr>
    ${inlineRuns}
  </w:p>`;
    } else {
      // Paragraph per option
      q.options.forEach((optText, optIdx) => {
        const letter = ['A', 'B', 'C', 'D', 'E'][optIdx];
        const isCorrectRed = config.markAnswerInRed && letter === q.answer;
        const colorVal = isCorrectRed ? 'FF0000' : '2B2B2B';
        const boldXml = isCorrectRed ? '<w:b/>' : '';
        bodyXml += `
  <w:p>
    <w:pPr>
      <w:spacing w:before="30" w:after="30"/>
      <w:ind w:left="840" w:hanging="420"/>
    </w:pPr>
    <w:r>
      <w:rPr>${boldXml}<w:color w:val="${colorVal}"/></w:rPr>
      <w:t xml:space="preserve">${optionLetters[optIdx]} ${escapeXml(optText)}</w:t>
    </w:r>
  </w:p>`;
      });
    }
  });

  // End of test banner
  bodyXml += `
  <w:p>
    <w:pPr>
      <w:jc w:val="center"/>
      <w:spacing w:before="300" w:after="100"/>
    </w:pPr>
    <w:r>
      <w:rPr><w:i/><w:color w:val="666666"/></w:rPr>
      <w:t>【 本 試 題 卷 結 束 ， 請 詳 細 檢 查 】</w:t>
    </w:r>
  </w:p>`;

  // Page setup (A4 standard: 11906 x 16838 dxa)
  const fullDocumentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${bodyXml}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
      <w:cols w:space="720"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  zip.file('word/document.xml', fullDocumentXml);

  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const fileName = `${config.subject}_標準試題卷.docx`;
  return { blob, fileName };
}

function escapeXml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
