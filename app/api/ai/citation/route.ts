import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { errorResponse, successResponse } from '@/lib/api-response';
import { createAdminClient } from '@/lib/supabase/admin';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Generates a professional certificate citation using Google Gemini AI.
 * Falls back to a smart template-based generator if no API key is configured.
 */
async function generateWithGemini(prompt: string, context?: string): Promise<{
  citation: string;
  title: string;
  organization: string;
}> {
  if (!GEMINI_API_KEY) {
    return generateWithTemplates(prompt, context);
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const systemPrompt = `You are a professional certificate citation writer for CertiDraft, a certificate generation platform. 
Your job is to write elegant, formal certificate body text based on the user's request.

RULES:
- Write ONLY the certificate body citation text (2-4 sentences max)
- Use formal, professional language appropriate for printed certificates
- Do NOT include headers like "Certificate of..." — just the body paragraph
- Do NOT use markdown, bullet points, or formatting
- Do NOT include placeholder names like [Name] — write it generically so it works for any recipient
- The tone should be celebratory, dignified, and inspiring
- Keep it concise — this text will be placed on a physical certificate

Respond in this exact JSON format:
{
  "citation": "The body text of the certificate",
  "title": "Suggested certificate title (e.g. Certificate of Excellence)",
  "organization": "Suggested organization name if mentioned, or 'Your Organization'"
}`;

    const userMessage = context 
      ? `Generate a certificate citation for: ${prompt}\nTemplate/Context: ${context}`
      : `Generate a certificate citation for: ${prompt}`;

    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userMessage }] }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
        responseMimeType: 'application/json',
      },
    });

    const responseText = result.response.text();
    
    try {
      const parsed = JSON.parse(responseText);
      return {
        citation: parsed.citation || 'Awarded for outstanding achievement and dedication.',
        title: parsed.title || 'Certificate of Achievement',
        organization: parsed.organization || 'Your Organization',
      };
    } catch {
      // If JSON parsing fails, use the raw text as citation
      return {
        citation: responseText.replace(/[{}"]/g, '').trim().slice(0, 300),
        title: 'Certificate of Achievement',
        organization: 'Your Organization',
      };
    }
  } catch (error) {
    console.error('Gemini API Error:', error);
    // Fall back to template-based generation
    return generateWithTemplates(prompt, context);
  }
}

/**
 * Smart template-based citation generator (fallback when no AI key is set).
 */
function generateWithTemplates(prompt: string, context?: string): {
  citation: string;
  title: string;
  organization: string;
} {
  const lowerPrompt = prompt.toLowerCase();

  // Detect category from prompt
  const categories: Record<string, { title: string; citations: string[] }> = {
    graduation: {
      title: 'Certificate of Graduation',
      citations: [
        'In recognition of successfully completing all academic requirements with distinction, demonstrating intellectual curiosity, perseverance, and a commitment to lifelong learning. This achievement marks the beginning of an inspiring journey ahead.',
        'Awarded upon the successful completion of all prescribed coursework and examinations, reflecting exceptional scholarly dedication, academic integrity, and the pursuit of knowledge that will shape a brighter future.',
      ],
    },
    training: {
      title: 'Certificate of Completion',
      citations: [
        'In recognition of the successful completion of the prescribed training program, demonstrating exceptional commitment to professional growth, skill development, and the application of industry best practices.',
        'Awarded for outstanding participation and mastery of all training modules, reflecting dedication to continuous improvement and professional excellence in the field.',
      ],
    },
    award: {
      title: 'Certificate of Excellence',
      citations: [
        'In recognition of extraordinary achievement and unwavering dedication that has set a benchmark of excellence. This award celebrates the passion, innovation, and leadership that inspire others to reach greater heights.',
        'Presented in honor of remarkable contributions and sustained excellence, demonstrating a level of commitment and expertise that truly distinguishes outstanding performance.',
      ],
    },
    leadership: {
      title: 'Certificate of Leadership',
      citations: [
        'In recognition of exceptional leadership qualities, vision, and the ability to inspire and guide teams toward shared goals with integrity, resilience, and a commitment to fostering collaborative success.',
        'Awarded for demonstrating outstanding leadership through strategic thinking, mentorship, and the ability to drive meaningful impact within the organization and community.',
      ],
    },
    volunteer: {
      title: 'Certificate of Appreciation',
      citations: [
        'In heartfelt appreciation for selfless dedication and generous contribution of time, energy, and expertise toward making a meaningful difference in our community. Your service inspires us all.',
        'Presented with gratitude for outstanding volunteer service, demonstrating compassion, commitment, and an unwavering spirit of giving that has positively touched countless lives.',
      ],
    },
    sports: {
      title: 'Certificate of Athletic Achievement',
      citations: [
        'In recognition of exceptional athletic performance, sportsmanship, and the discipline required to compete at the highest level. This achievement reflects dedication, resilience, and the true spirit of competition.',
        'Awarded for outstanding achievement in athletic competition, demonstrating remarkable talent, determination, and the competitive spirit that defines a true champion.',
      ],
    },
    participation: {
      title: 'Certificate of Participation',
      citations: [
        'In recognition of active and enthusiastic participation, contributing valuable insights and energy that enriched the experience for all involved. Your engagement is deeply valued and appreciated.',
        'Awarded for meaningful participation and contribution, reflecting a genuine commitment to learning, collaboration, and personal growth throughout the program.',
      ],
    },
  };

  // Match category
  let matched = categories.award; // default
  for (const [key, value] of Object.entries(categories)) {
    if (lowerPrompt.includes(key)) {
      matched = value;
      break;
    }
  }

  // Check for more keywords
  if (lowerPrompt.includes('complet') || lowerPrompt.includes('course') || lowerPrompt.includes('program')) {
    matched = categories.training;
  }
  if (lowerPrompt.includes('graduat') || lowerPrompt.includes('diploma') || lowerPrompt.includes('degree')) {
    matched = categories.graduation;
  }
  if (lowerPrompt.includes('volunteer') || lowerPrompt.includes('service') || lowerPrompt.includes('communit')) {
    matched = categories.volunteer;
  }
  if (lowerPrompt.includes('sport') || lowerPrompt.includes('athlet') || lowerPrompt.includes('champion')) {
    matched = categories.sports;
  }
  if (lowerPrompt.includes('lead') || lowerPrompt.includes('manag') || lowerPrompt.includes('director')) {
    matched = categories.leadership;
  }

  const citation = matched.citations[Math.floor(Math.random() * matched.citations.length)];

  return {
    citation,
    title: matched.title,
    organization: 'Your Organization',
  };
}

export async function POST(request: NextRequest) {
  try {
    const userAuth = await verifyAuth(request);
    if (!userAuth) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    // Verify Pro plan
    const admin = createAdminClient();
    const { data: user } = await admin
      .from('users')
      .select('plan')
      .eq('id', userAuth.id)
      .single();

    if (!user || (user.plan !== 'pro' && user.plan !== 'enterprise')) {
      return errorResponse('FORBIDDEN', 'AI Citation is a Pro feature. Please upgrade your plan.', 403);
    }

    const body = await request.json();
    const { prompt, context } = body;

    if (!prompt) {
      return errorResponse('BAD_REQUEST', 'Prompt is required', 400);
    }

    // Generate citation using AI or templates
    const result = await generateWithGemini(prompt, context);

    return successResponse({
      citation: result.citation,
      suggestedFields: {
        title: result.title,
        organization: result.organization,
        date: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', month: 'long', day: 'numeric' 
        }),
      },
    });
  } catch (error) {
    console.error('AI Citation Error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to generate AI citation', 500);
  }
}
