import axios from 'axios';

// Fallback heuristics-based customer segmentation and recommendation engine
export const analyzeAudienceHeuristics = (customers) => {
  const customerIds = customers.map(c => c._id);
  
  // Calculate average spend and orders to dynamically calibrate segments
  const totalSpendSum = customers.reduce((sum, c) => sum + c.totalSpend, 0);
  const avgSpend = totalSpendSum / customers.length;
  
  const totalOrdersSum = customers.reduce((sum, c) => sum + c.totalOrders, 0);
  const avgOrders = totalOrdersSum / customers.length;

  const highValueCustomers = [];
  const likelyToRepurchase = [];
  const atRiskCustomers = [];

  customers.forEach(cust => {
    // 1. High Value: spend is above average OR spend is >= 200
    if (cust.totalSpend >= avgSpend || cust.totalSpend >= 200) {
      highValueCustomers.push(cust._id);
    }
    
    // 2. Likely to Repurchase: ordered recently or has high number of orders (orders >= average and spend is decent)
    // In our CSV we can parse lastOrders or just check totalOrders
    const lastOrderVal = parseInt(cust.lastOrders) || 0;
    if (cust.totalOrders > avgOrders || (lastOrderVal <= 30 && lastOrderVal > 0)) {
      likelyToRepurchase.push(cust._id);
    }

    // 3. At Risk: low orders and not ordered in a long time (e.g. lastOrders > 90 days or totalOrders <= 2)
    if (cust.totalOrders <= 2 || lastOrderVal > 90) {
      atRiskCustomers.push(cust._id);
    }
  });

  // Ensure every group has at least something, or handle empty sets
  // Determine dominant group to suggest campaign
  let title = "Summer Loyalty Rewards";
  let offer = "15% Cash Back on next order";
  let reason = "Your audience contains active shoppers with moderate spending. A loyalty reward will encourage high frequency.";

  if (atRiskCustomers.length > highValueCustomers.length && atRiskCustomers.length > likelyToRepurchase.length) {
    title = "We Miss You Campaign";
    offer = "Buy 1 Get 1 FREE + Free Shipping";
    reason = "A large portion of your audience has been classified as 'At Risk' (low purchase frequency or inactive recently). This reactivation campaign is designed to win them back.";
  } else if (highValueCustomers.length >= likelyToRepurchase.length) {
    title = "VIP Exclusive Access";
    offer = "25% OFF Storewide + Early Access to Fall Collection";
    reason = "Your audience has strong spending patterns (High Value). Offering an exclusive premium incentive will maximize order values.";
  } else if (likelyToRepurchase.length > 0) {
    title = "Flash Repeat Purchase Sale";
    offer = "Extra 20% OFF next purchase code: REPEAT20";
    reason = "A significant portion of customers have high transaction counts (Likely to Repurchase). A target discount will prompt rapid return purchases.";
  }

  return {
    highValueCustomers,
    likelyToRepurchase,
    atRiskCustomers,
    recommendedCampaign: {
      title,
      offer,
      reason
    }
  };
};

// Main function to segment and recommend campaigns
export const analyzeAudience = async (customers) => {
  const hfToken = process.env.HF_API_KEY || process.env.HF_TOKEN;

  if (!hfToken) {
    console.warn("Hugging Face API key not found. Using local heuristics engine fallback.");
    return analyzeAudienceHeuristics(customers);
  }

  try {
    // We format the customers data into a concise summary to prevent token overflows
    const customerSummary = customers.map(c => ({
      id: c._id.toString(),
      name: c.name,
      age: c.age,
      city: c.city,
      totalOrders: c.totalOrders,
      totalSpend: c.totalSpend,
      lastOrders: c.lastOrders
    }));

    const prompt = `[SYSTEM]
You are a CRM Marketing Data Analyst. Your task is to segment a list of customers and recommend a marketing campaign.
You must respond with ONLY a valid raw JSON object. Do not include markdown codeblocks (e.g. \`\`\`json) or any conversational text.

Expected Output Schema:
{
  "highValueCustomers": ["id1", "id2"],
  "likelyToRepurchase": ["id1", "id3"],
  "atRiskCustomers": ["id4"],
  "recommendedCampaign": {
    "title": "Campaign Title",
    "offer": "Discount Details",
    "reason": "Justification based on data"
  }
}

Analyze the following customer data:
${JSON.stringify(customerSummary, null, 2)}
`;

    const response = await axios.post(
      'https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct',
      {
        inputs: prompt,
        parameters: {
          max_new_tokens: 800,
          temperature: 0.2,
          return_full_text: false
        }
      },
      {
        headers: {
          Authorization: `Bearer ${hfToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10s timeout
      }
    );

    let resultText = '';
    if (Array.isArray(response.data) && response.data[0] && response.data[0].generated_text) {
      resultText = response.data[0].generated_text.trim();
    } else if (response.data && response.data.generated_text) {
      resultText = response.data.generated_text.trim();
    } else {
      throw new Error("Invalid response format from Hugging Face");
    }

    // Attempt to extract JSON from Hugging Face response
    // LLMs sometimes enclose JSON in codeblocks or prepend conversational filler
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not find JSON structure in response: " + resultText);
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validation: make sure it has the required fields
    if (
      Array.isArray(parsed.highValueCustomers) &&
      Array.isArray(parsed.likelyToRepurchase) &&
      Array.isArray(parsed.atRiskCustomers) &&
      parsed.recommendedCampaign &&
      parsed.recommendedCampaign.title &&
      parsed.recommendedCampaign.offer &&
      parsed.recommendedCampaign.reason
    ) {
      return parsed;
    } else {
      throw new Error("AI output missing required JSON fields");
    }

  } catch (error) {
    console.error("Hugging Face API call failed or returned bad data. Using heuristics engine fallback. Error:", error.message);
    return analyzeAudienceHeuristics(customers);
  }
};

// Generate personalized marketing email body using Hugging Face
export const generateEmailsAI = async (campaignDetails, customerDetails) => {
  const hfToken = process.env.HF_API_KEY || process.env.HF_TOKEN;

  // Local fallback templates for email generation
  const generateLocalEmail = (campaign, customer) => {
    const subject = `Exclusive Offer for you, ${customer.name}! - ${campaign.title}`;
    const body = `Hi ${customer.name},

Greetings from our team in ${customer.city}! We noticed you've placed ${customer.totalOrders} order(s) with us and we appreciate your loyalty.

To thank you, we're thrilled to offer you: ${campaign.offer}.

${campaign.reason}

Don't wait! Click the link below to view and claim your offer:
{{tracking_link}}

Best regards,
The Marketing Team`;
    return { subject, body };
  };

  if (!hfToken) {
    return generateLocalEmail(campaignDetails, customerDetails);
  }

  try {
    const prompt = `[SYSTEM]
You are a professional copywriter. Write a personalized marketing email for a shopper.
Return ONLY a JSON response matching the following schema. Do not write any explanation or markdown formatting:
{
  "subject": "Email Subject",
  "body": "Email body message"
}

Important constraint:
Include the exact text "{{tracking_link}}" in the body where the personalized tracking link should be inserted.

Context details:
- Campaign Title: ${campaignDetails.title}
- Campaign Offer: ${campaignDetails.offer}
- Customer Name: ${customerDetails.name}
- Customer City: ${customerDetails.city}
- Customer total orders: ${customerDetails.totalOrders}
- Customer total spend: $${customerDetails.totalSpend}
`;

    const response = await axios.post(
      'https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct',
      {
        inputs: prompt,
        parameters: {
          max_new_tokens: 600,
          temperature: 0.7,
          return_full_text: false
        }
      },
      {
        headers: {
          Authorization: `Bearer ${hfToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 8000
      }
    );

    let resultText = '';
    if (Array.isArray(response.data) && response.data[0] && response.data[0].generated_text) {
      resultText = response.data[0].generated_text.trim();
    } else if (response.data && response.data.generated_text) {
      resultText = response.data.generated_text.trim();
    } else {
      throw new Error("Invalid response format");
    }

    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not find JSON block in email response");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed.subject && parsed.body) {
      return parsed;
    } else {
      throw new Error("AI output missing subject or body");
    }
  } catch (error) {
    console.error("AI Email Generation failed. Falling back to template. Error:", error.message);
    return generateLocalEmail(campaignDetails, customerDetails);
  }
};
