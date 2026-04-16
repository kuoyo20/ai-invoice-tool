import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    if (!GOOGLE_GEMINI_API_KEY) throw new Error('GOOGLE_GEMINI_API_KEY is not configured');

    const { imageBase64, mimeType, categoryHints } = await req.json();
    if (!imageBase64) throw new Error('No image data provided');

    const basePrompt = `你是一個專業且細心的台灣會計報帳助理。請辨識這張發票、收據或明細的照片。
請精準萃取出報帳所需資訊。請特別注意：如果圖片中包含多個購買品項（例如多種飲料、菜色、文具等），請務必將「所有」品項的名稱和數量完整辨識出來，並使用逗號分隔填寫在 notes (備註) 欄位中。絕對不要只寫一項或遺漏任何商品。
分類(category)請從以下選擇最適合的：交通費、餐飲費、交際費、辦公用品、進修訓練、雜支。

**重要：統一編號辨識**
請仔細辨識發票上的「買受人統一編號」（買方統編）。
- 台灣統一編號為 8 位數字。
- 發票上可能標示為「統一編號」、「統編」、「買受人」等。
- 注意區分「賣方統編」和「買方統編」，我們需要的是「買方統編」（即報帳公司的統編）。
- 如果發票上沒有買方統編（例如個人消費的二聯式發票），請將 tax_id 設為空字串 ""。
- 如果有買方公司名稱，請填入 company_name。

回覆必須是 JSON 陣列格式，每個物件包含以下欄位：
- date: 日期 (格式 YYYY-MM-DD，請將民國年轉西元)
- type: 憑證類型 (如: 電子發票、傳統發票、計程車收據、明細)
- store: 消費店家名稱或開立發票單位
- amount: 總金額 (純數字)
- category: 報帳類別
- notes: 請完整列出發票上的『所有』品項名稱與數量，使用逗號分隔 (例如: 冰拿鐵x2, 總匯三明治x1, 塑膠袋x1)。絕對不能遺漏任何品項。
- tax_id: 買方統一編號 (8位數字字串，沒有則填 "")
- company_name: 買方公司名稱 (沒有則填 "")

只回覆 JSON 陣列，不要其他文字。`;

    // 注入使用者分類偏好 (few-shot learning)
    const prompt = categoryHints
      ? basePrompt + categoryHints
      : basePrompt;

    // Call Google Gemini API directly
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType || "image/jpeg",
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "請求太頻繁，請稍後再試。" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("Gemini API error:", response.status, t);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const result = await response.json();
    const textContent = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      throw new Error("無法從圖片中辨識出有效資訊");
    }

    let jsonStr = textContent.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    const parsedData = JSON.parse(jsonStr);

    return new Response(JSON.stringify({ data: parsedData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("process-receipt error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
