"use server";

// 导入我们新创建的工具函数
import { verifyTokenAndManageQuota } from "../auth-and-quota";

// 【核心修复】: 导入所有需要的类型
import type {
    GenerativeModel,
    GenerateContentRequest,
    Part,
} from "@google-cloud/vertexai";

// 【核心修复】: 已移除顶层作用域的所有 require 和 new VertexAI() 语句

// Truncate logs to be readable
export async function truncateLog(obj: any, maxLength = 300): Promise<any> {
    const truncatedObj = JSON.parse(JSON.stringify(obj));

    for (const key in truncatedObj) {
        if (typeof truncatedObj[key] === "string" && truncatedObj[key].length > maxLength) {
            truncatedObj[key] = truncatedObj[key].slice(0, maxLength) + "...";
        } else if (typeof truncatedObj[key] === "object") {
            truncatedObj[key] = await truncateLog(truncatedObj[key], maxLength);
        }
    }

    return truncatedObj;
}

export async function cleanResult(inputString: string): Promise<string> {
    return inputString.toString().replaceAll("\n", "").replaceAll(/\//g, "").replaceAll("*", "");
}

function getFormatFromBase64(base64String: string): string {
    if (!base64String.startsWith("data:image/")) return "image/png";
    return base64String.split(";")[0].split(":")[1];
}

// Helper function to initialize VertexAI and get the model
async function getGenerativeModel(): Promise<GenerativeModel> {
    // 【核心修复】: 动态导入
    const { VertexAI } = await import("@google-cloud/vertexai");

    const location = process.env.NEXT_PUBLIC_VERTEX_API_LOCATION;
    const geminiModel = process.env.NEXT_PUBLIC_GEMINI_MODEL;
    const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

    if (!projectId || !location || !geminiModel) {
        throw new Error("Missing required environment variables for Vertex AI (Project ID, Location, or Model).");
    }

    // 【核心修复】: 直接将 project 和 location 作为字符串传递
    const vertexAI = new VertexAI({ project: projectId, location: location });
    return vertexAI.getGenerativeModel({ model: geminiModel });
}


export async function getDescriptionFromGemini(base64Image: string, type: string): Promise<string | { error: string }> {
    try {
        await verifyTokenAndManageQuota("gemini");
    } catch (error: any) {
        console.error("Auth/Quota check failed for getDescriptionFromGemini:", error.message);
        return { error: error.message };
    }

    try {
        const generativeModel = await getGenerativeModel();

        let descriptionPrompt = "";
        if (type === "Person")
            descriptionPrompt =
                "State the primary subject in this image. Only use terms that describe a person's age and gender (e.g., boy, girl, man, woman). " +
                "Do not state what the person is doing, or other object present in the image. ";
        if (type === "Animal") descriptionPrompt = "State the primary animal in this image. Only use its race. ";
        if (type === "Product")
            descriptionPrompt =
                "State the primary product in this image using the most common and simple term (e.g., chair, table, phone). " +
                "If you recognize the brand or the model, use them. ";
        if (type === "Style")
            descriptionPrompt =
                "Describe the overall style of this image, not what is happening in it. Use terms like 'minimalist', 'vintage', 'surreal', 'abstract', 'modern', etc. ";
        if (type === "Default")
            descriptionPrompt =
                "State the primary subject in this image using the most common and simple term. Don't state what it is doing or where it is. ";

        descriptionPrompt =
            descriptionPrompt +
            "Use a subject format of 40 characters or less, with no period at the end. " +
            "If you can't generate the output, for instance because the image content is not matching the type, just send back 'Error'";

        const imagePart: Part = {
            inlineData: {
                data: base64Image.startsWith("data:") ? base64Image.split(",")[1] : base64Image,
                mimeType: getFormatFromBase64(base64Image),
            },
        };
        const textPart: Part = {
            text: descriptionPrompt,
        };

        const reqData: GenerateContentRequest = {
            contents: [{ role: "user", parts: [imagePart, textPart] }],
        };

        const resp = await generativeModel.generateContent(reqData);
        const contentResponse = resp.response;

        const candidate = contentResponse.candidates?.[0];
        if (!candidate?.content?.parts?.[0]?.text) {
             throw new Error("Invalid response structure from Gemini API.");
        }

        const newDescription = await cleanResult(candidate.content.parts[0].text);

        if (newDescription.includes("Error")) return "(provided type is not matching image)";
        else return newDescription;

    } catch (error: any) {
        console.error(JSON.stringify(await truncateLog(error), undefined, 4));
        return {
            error: "Error while getting description from Gemini.",
        };
    }
}

export async function getFullReferenceDescription(base64Image: string, type: string): Promise<string | { error: string }> {
    try {
        await verifyTokenAndManageQuota("gemini");
    } catch (error: any) {
        console.error("Auth/Quota check failed for getFullReferenceDescription:", error.message);
        return { error: error.message };
    }

    try {
        const generativeModel = await getGenerativeModel();

        let specificPromptInstructions = "";
        let activeCommonDetailedInstructions = "";

        const generalCommonDetailedInstructions =
            " Your primary goal is to generate an exceptionally detailed, meticulous, and comprehensive description of the primary subject's visual attributes. " +
            "**The entire description should be concise, ideally around 100-120 words, and must not exceed 130 words.** " +
            "While achieving this, strictly adhere to the following rules: " +
            "1. Begin the description directly with the subject's characteristics, without any introductory phrases like 'This image shows...' or 'The subject is...'. " +
            "2. The description must focus exclusively on the visual attributes of the primary subject itself. " +
            "3. Do NOT describe the subject's actions, what the subject is doing, its location, the surrounding environment, or the background. Confine the description strictly to the physical appearance of the subject. " +
            "4. Ensure the description paints a clear and vivid visual picture as if under close inspection, focusing on objective visual facts. " +
            "If you cannot satisfy the primary goal (an exceptionally detailed, subject-focused visual description) while strictly adhering to all the numbered rules, or if the image content does not clearly match the requested type, is ambiguous, or if a meaningful description of a singular primary subject cannot be generated, then respond with the single word 'error'.";

        const styleCommonDetailedInstructions =
            " Your primary goal is to generate an exceptionally detailed, meticulous, and comprehensive analysis of the image's overall artistic and visual style. " +
            "**The entire description should be concise, ideally around 100-120 words, and must not exceed 130 words.** " +
            "While achieving this, strictly adhere to the following rules: " +
            "1. Begin the description directly with the style's characteristics, without any introductory phrases like 'This image shows...'. " +
            "2. Focus on how visual elements collectively create the style. When discussing composition, color, lighting, and texture as they contribute to the style, you may refer to how these apply to the general forms, shapes, and atmosphere of the depicted scene. However, do NOT provide an inventory of discrete objects as if describing a scene's content, nor describe any narrative actions or specific, identifiable real-world locations. The emphasis is on the *how* of the style, not the *what* of the scene's literal content. " +
            "3. Ensure the description paints a clear and vivid visual picture of the style itself, focusing on objective visual analysis of its components. " +
            "If a meaningful and detailed analysis of the image's style cannot be generated according to these exacting rules, or if the image is too ambiguous, respond with the single word 'error'.";

        if (type === "Person") {
            activeCommonDetailedInstructions = generalCommonDetailedInstructions;
            specificPromptInstructions =
                "Provide an exceptionally detailed and meticulous description of the primary person in this image, focusing strictly on their physical appearance. Break down their appearance into specific regions and features, describing each with precision. " +
                "Detail their apparent age range and gender. For their hair, describe its color nuances, style from roots to ends, length, texture (e.g., fine, coarse, wavy, straight, coily), and any specific characteristics like parting, layers, or highlights. " +
                "For their face, provide granular details about eye color, iris patterns if visible, eye shape, eyelashes, eyebrows (shape, thickness, color), nose (shape of bridge, nostrils, tip), mouth and lip characteristics (shape, fullness, color, texture), chin, jawline, and skin (tone, texture, any visible pores or fine lines if clear). Describe any static facial expression (e.g., a gentle smile, a neutral look) by detailing the muscle positioning. " +
                "Describe their build or physique (e.g., slender, muscular, average) if discernible. Enumerate and describe any unique identifying features like glasses (detailing frame style, material, color, lens appearance), tattoos (location, colors, subject matter if clear), scars, or birthmarks with precision. " +
                "**The description must NOT mention any clothing, attire, or accessories other than the specified glasses.**";
        } else if (type === "Animal") {
            activeCommonDetailedInstructions = generalCommonDetailedInstructions;
            specificPromptInstructions =
                "Provide an exceptionally detailed and meticulous description of the primary animal in this image, focusing strictly on its physical characteristics. Break down its appearance into specific features and describe each with precision. " +
                "Detail its species and breed (if identifiable). For its coat or covering, describe the primary and secondary color(s) and shades, intricate patterns (e.g., spots, stripes, patches – noting their shape, size, color, and exact distribution on the body), and texture (e.g., smooth, shaggy, sleek, dense, sparse, glossy, matte) of its fur, feathers, scales, or skin. " +
                "Describe its approximate size, overall build (e.g., slender, robust, delicate, muscular), and specific body shape and proportions. " +
                "Enumerate and describe any distinctive physical features with specificity: the shape and size of its head, ear shape and position (e.g., pricked, floppy, tufted), eye color and pupil shape, muzzle or beak (length, width, shape, color, nostril details), presence and nature of teeth or fangs if visible, tongue if visible, horns or antlers (size, shape, texture, color, number of points if applicable), neck (length, thickness), legs (number, length, thickness, joint appearance), paws or hooves or claws (shape, color, number of digits, claw details), tail (length, shape, covering, how it's held if static and characteristic), and any unique markings or physical traits not covered by general patterning. " +
                "If discernible, mention its apparent age (e.g., juvenile, adult, very old based on physical indicators). ";
        } else if (type === "Product") {
            activeCommonDetailedInstructions = generalCommonDetailedInstructions;
            specificPromptInstructions =
                "Provide an exceptionally detailed and meticulous description of the primary product in this image, focusing strictly on its physical attributes. Break down the product into its constituent parts, components, and surfaces, describing each with precision, as if conducting a thorough visual inspection for a catalog or engineering specification. " +
                "Detail its exact type (e.g., specific type of chair, smartphone model, winter jacket). Identify brand and model if any markings or distinct design cues are visible. " +
                "For its materials, specify all visible types (e.g., polished chrome, brushed aluminum, matte plastic, specific wood like oak or walnut, type of fabric like corduroy or canvas, glass, ceramic) and describe their textures (e.g., smooth, grained, ribbed, dimpled, woven) and finishes (e.g., glossy, matte, satin, metallic). " +
                "Describe all colors and shades present, and any patterns or graphical elements. Detail its overall shape and geometry, approximate dimensions or proportions if inferable. " +
                "Describe each specific design element meticulously: for a jacket, this would include the collar type (e.g., stand-up, notch lapel), fastening mechanisms (e.g., specific type of zipper, buttons - their material, shape, and how they attach, snaps, Velcro), pocket design (e.g., welt, patch, zippered - their placement, size, flap details), cuff and hem finishing, stitching type and visibility, lining if visible, and any logos or tags. For a phone, describe screen borders, button placement and shape, port types and locations, camera lens arrangement, and casing details. For furniture, describe legs, supports, surfaces, joinery if visible, and hardware. " +
                "Note any visible aspects of its construction, assembly, seams, or edges. The goal is a comprehensive inventory of all its visual characteristics. ";
        } else if (type === "Style") {
            activeCommonDetailedInstructions = styleCommonDetailedInstructions;
            specificPromptInstructions =
                "Analyze and describe the overall artistic and visual style of this image with meticulous and analytical detail. " +
                "Elaborate on stylistic elements such as: the dominant aesthetic (e.g., minimalist, vintage, surreal, abstract, modern, photorealistic, painterly, graphic novel art, cyberpunk, solarpunk), elaborating on how specific visual choices achieve this effect; " +
                "the color palette – its range (e.g., monochromatic, analogous, complementary), specific hues, saturation, value, temperature, and how colors interact or are used to create harmony or contrast, noting dominant and accent colors; " +
                "lighting techniques – the quality (hard, soft), direction, intensity, color of light, and its precise impact on mood, form, texture, and creation of highlights and shadows (e.g., volumetric lighting, neon glow, diffuse, chiaroscuro); " +
                "compositional choices – adherence to or deviation from principles like the rule of thirds, leading lines, symmetry/asymmetry, balance, framing, viewpoint (e.g., low-angle, high-angle, eye-level), perspective (e.g., linear, atmospheric), and depth of field, and their effect on the viewer's focus and interpretation of the style; " +
                "prevalent textures (e.g., weathered stone, metallic sheen, organic overgrowth, digital noise) and patterns, noting their characteristics, repetition, and contribution to the style; " +
                "and the overall mood or atmosphere the style distinctively creates (e.g., dystopian, ethereal, gritty, vibrant, mysterious, tranquil). Analyze how these visual and artistic elements interrelate to define the overall style comprehensively. ";
        } else {
            activeCommonDetailedInstructions = generalCommonDetailedInstructions;
            specificPromptInstructions =
                "Identify the single most prominent primary subject in this image. If a singular primary subject is clearly identifiable, " +
                "provide an exceptionally detailed and meticulous description of its visual characteristics. This includes its specific category (e.g., a particular species of flower, a type of antique clock, a specific pastry, an abstract sculptural form). " +
                "Then, provide a granular breakdown of its physical appearance: all visible colors and their shades, precise shapes and geometric forms, an estimation of its real-world size if inferable, all discernible textures (e.g., smooth, rough, porous, reflective, matte), types of materials it appears to be made of, and a detailed account of any specific parts, components, segments, layers, or markings. Describe each aspect with precision. " +
                "If the image does not contain a singular, clearly identifiable primary subject that can be described in such exhaustive detail according to these rules (e.g., it is primarily a complex landscape or cityscape without a single dominant subject easily isolated from its context, or a very abstract pattern where 'subject' is ill-defined for this purpose), " +
                "or if describing it adequately requires detailing background, location, or actions, then respond with the single word 'Error'. ";
        }

        const fullPrompt = specificPromptInstructions + activeCommonDetailedInstructions;

        const imagePart: Part = {
            inlineData: {
                data: base64Image.startsWith("data:") ? base64Image.split(",")[1] : base64Image,
                mimeType: getFormatFromBase64(base64Image),
            },
        };
        const textPart: Part = {
            text: fullPrompt,
        };

        const reqData: GenerateContentRequest = {
            contents: [{ role: "user", parts: [imagePart, textPart] }],
        };

        const resp = await generativeModel.generateContent(reqData);

        if (!resp.response) {
            throw new Error("No response object found from generateContent call.");
        }

        const contentResponse = resp.response;
        const candidate = contentResponse.candidates?.[0];

        if (!candidate?.content?.parts?.[0]?.text) {
             throw new Error("Invalid response structure from Gemini API.");
        }

        const newDescription = await cleanResult(candidate.content.parts[0].text);

        if (newDescription.includes("Error")) {
            return "(provided type is not matching image or description could not be generated)";
        } else {
            return newDescription;
        }
    } catch (error: any) {
        console.error(JSON.stringify(await truncateLog(error), undefined, 4));
        return {
            error: "Error while getting description from Gemini.",
        };
    }
}

export async function getPromptFromImageFromGemini(
    base64Image: string,
    target: "Image" | "Video",
    userQuery?: string
): Promise<string | { error: string }> {
    try {
        await verifyTokenAndManageQuota("gemini");
    } catch (error: any) {
        console.error("Auth/Quota check failed for getPromptFromImageFromGemini:", error.message);
        return { error: error.message };
    }

    try {
        const generativeModel = await getGenerativeModel();

        const imagenPromptTemplate = `Your Role:
      You are an expert prompt engineer for advanced text-to-image models like Google Imagen. Your mission is to convert a user's basic idea into a single, highly-detailed, and technically precise prompt by systematically combining descriptive elements.

      Core Directive:
      You must follow the structured categories below to build a comprehensive prompt. The final output should be a single, coherent descriptive paragraph designed to maximize image quality, realism, and artistic impact.

      Prompt Constituent Elements:

      Core Components: This is the foundation of the image.

      Style/Medium: Define the overall artistic form. E.g., cinematic photograph, oil painting, 3D render, charcoal sketch.
      Subject: Clearly and vividly describe the central object or figure. Use expressive adjectives. E.g., a majestic lion, a solitary lighthouse.
      Detailed Description: Elaborate on the subject's specific features, pose, expression, and texture. E.g., with a thick golden mane, looking directly and intensely at the camera.
      Environment/Background: Establish the setting, time of day, weather, and atmosphere. E.g., in the Serengeti during a vibrant sunset.
      Photographic & Artistic Style: These are the key technical details that define the visual execution.

      Composition/View: Specify the camera's framing and perspective. E.g., close-up shot, wide-angle shot, low-angle view, portrait.
      Lighting: Describe the type, direction, and quality of the light. E.g., dramatic golden hour lighting, soft, diffused light from a window.
      Color Scheme: Define the dominant color palette and mood. E.g., warm tones, monochromatic blue palette, vibrant and saturated colors.
      Technical Parameters: For ultimate realism, include specific photographic settings:
      Lens Type: E.g., shot on an 85mm lens (to influence perspective and depth of field).
      Camera Settings: E.g., f/1.8 aperture (to create a shallow depth of field and blurred background).
      Film Type: E.g., emulating the look of Portra 800 film (for specific color rendition and grain).
      Quality: Emphasize the desired level of detail and fidelity. E.g., 8k, photorealistic, hyperdetailed, intricate textures.
      Final Output Format:

      Combine all the above elements into a single, flowing descriptive paragraph in English.
      Use commas to connect the descriptive phrases, creating a dense and informative command.
      Do not use conversational preambles, explanations, or lists in the final output. Output the prompt directly.
      Example (Based on the provided image):
      cinematic photograph, a majestic lion with a golden mane, looking directly at the camera, in the Serengeti during sunset. A close-up shot with golden hour lighting and warm tones, shot on an 85mm lens at f/1.8, emulating the look of Portra 800 film, 8k, photorealistic, hyperdetailed.`;

        const veoPromptTemplate = `You are an AI prompt engineer specializing in generating video prompts for Veo3. Your task is to create new prompts based on a provided example, ensuring variety in scenes.

      Example Prompt:

      Subject: Marcus, a confident street interviewer in his late 20s, wearing trendy casual clothing

      Context: busy urban street with pedestrians and city life in background, natural street environment

      Action: approaches people with microphone, engaging in spontaneous conversations with genuine curiosity

      Style: documentary street style with natural lighting, authentic urban aesthetic

      Camera: handheld documentary style with dynamic movement, following action naturally

      Composition: medium shots capturing both interviewer and subjects, environmental context

      Ambiance: natural daylight with urban atmosphere, street lighting

      Audio: clear interview audio: 'What's the most interesting thing that happened to you today?' with authentic street ambiance


      Instructions:

      1. Maintain the structure of the example prompt, including Subject, Context, Action, Style, Camera, Composition, Ambiance, Audio, and Negative prompt.
      2. Vary the scenes and contexts to avoid repetition.
      3. Ensure the prompts are suitable for generating realistic and engaging video content with Veo3.
      4. Focus on creating prompts that capture authentic and natural moments.
      5. Avoid any elements that would result in unrealistic or artificial-looking videos, as specified in the Negative prompt.
      6.In your response, do not include any introductory or explanatory statements, such as 'Here is a video prompt based on the provided image, following the specified structure and guidelines.'`;

        let finalPrompt = "";
        const basePrompt = target === "Image" ? imagenPromptTemplate : veoPromptTemplate;

        if (userQuery && userQuery.trim() !== "") {
            finalPrompt = `A user has provided an image and a specific request. Your task is to generate a new, comprehensive prompt that incorporates the user's request while still being suitable for the target model (${target}).

        **User's Request:** "${userQuery}"

        Analyze the user's request in the context of the provided image. Then, generate a single, cohesive paragraph prompt that fulfills this request. The final prompt must follow all the rules and formatting guidelines outlined below. Do not add any conversational filler or directly answer the user's question; instead, integrate their intent into the final generative prompt.

        ---
        **Original Prompting Guidelines:**
        ${basePrompt}
        `;
        } else {
            finalPrompt = basePrompt;
        }

        const imagePart: Part = {
            inlineData: {
                data: base64Image.startsWith("data:") ? base64Image.split(",")[1] : base64Image,
                mimeType: getFormatFromBase64(base64Image),
            },
        };
        const textPart: Part = {
            text: finalPrompt,
        };

        const generationConfig = {
            temperature: 0.2,
            topP: 0.95,
            maxOutputTokens: 8192,
        };

        const reqData: GenerateContentRequest = {
            contents: [{ role: "user", parts: [imagePart, textPart] }],
            generationConfig: generationConfig,
        };

        const resp = await generativeModel.generateContent(reqData);
        const contentResponse = resp.response;

        const candidate = contentResponse.candidates?.[0];
        if (!candidate?.content?.parts?.[0]?.text) {
             throw new Error("Invalid response structure from Gemini API.");
        }

        const newDescription = candidate.content.parts[0].text.replace(/ +/g, " ").trimEnd();

        if (newDescription.includes("Error")) return "(provided type is not matching image)";
        else return newDescription;

    } catch (error: any) {
        console.error(JSON.stringify(await truncateLog(error), undefined, 4));
        return {
            error: "Error while getting prompt from Image with Gemini.",
        };
    }
}

export async function getPromptFromVideoFromGemini(gcsUri: string): Promise<string | { error: string }> {
    try {
        await verifyTokenAndManageQuota("gemini");
    } catch (error: any) {
        console.error("Auth/Quota check failed for getPromptFromVideoFromGemini:", error.message);
        return { error: error.message };
    }

    try {
        const generativeModel = await getGenerativeModel();

        const videoPart: Part = {
            fileData: {
                mimeType: "video/mp4",
                fileUri: gcsUri,
            },
        };

        const textPart: Part = {
            text: `You are an expert AI video analyst and prompt engineer. Your function is to deconstruct a provided video clip and reverse-engineer a detailed, structured prompt suitable for a text-to-video model like Veo. Your analysis must be meticulous, capturing the essence of the video's narrative, style, and technical execution.

Core Directive:
Analyze the input video clip with precision. For each of the categories below, you must extract the most salient visual, auditory, and narrative information. The goal is to create a prompt that, if given to a text-to-video model, would generate a clip that is thematically, stylistically, and dynamically similar to the original video.

Analysis & Prompt Generation Process:

Subject: Identify the primary character(s) or object(s) of focus. Describe their appearance, clothing, age, species, demeanor, and any defining features observed in the video.

Example Analysis: The video focuses on a man in his late 20s who looks confident and is dressed in fashionable street clothes.
Example Output: Subject: Marcus, a confident street interviewer in his late 20s, wearing trendy casual clothing
Context: Describe the environment, location, and background elements. Note the time of day, the overall setting (e.g., urban, natural, indoor), and the general activity occurring in the background.

Example Analysis: The scene is a busy city street during the day with many people walking by.
Example Output: Context: busy urban street with pedestrians and city life in background, natural street environment
Action: Detail the specific actions, movements, and interactions performed by the subject(s) throughout the clip. Describe the sequence of events from beginning to end.

Example Analysis: The man is walking up to different people, holding out a microphone, and asking them questions. He seems curious and the interactions are not staged.
Example Output: Action: approaches people with microphone, engaging in spontaneous conversations with genuine curiosity
Style: Analyze the overall visual aesthetic. Determine if it is documentary, cinematic, vintage, high-fashion, etc. Describe the visual treatment and color grading.

Example Analysis: The video looks like a real documentary. The lighting isn't artificial, and it feels like authentic city life.
Example Output: Style: documentary street style with natural lighting, authentic urban aesthetic
Camera: Describe the camera work. Note if it is static, handheld, a drone shot, or on a dolly. Describe any specific movements like pans, tilts, zooms, or how it follows the subject.

Example Analysis: The camera is not steady; it moves around as if someone is holding it, following the interviewer.
Example Output: Camera: handheld documentary style with dynamic movement, following action naturally
Composition: Analyze the framing and shot types used (e.g., close-ups, medium shots, wide shots). Describe how subjects and the environment are arranged within the frame.

Example Analysis: The shots are mostly from the waist up, showing both the interviewer and the person he's talking to, with the city visible around them.
Example Output: Composition: medium shots capturing both interviewer and subjects, environmental context
Ambiance: Describe the lighting conditions and the overall mood they create. Note any atmospheric elements that contribute to the scene's feel.

Example Analysis: It's daytime, and the light seems natural. The overall feeling is that of a normal day in a city.
Example Output: Ambiance: natural daylight with urban atmosphere, street lighting
Audio: Transcribe any clear, key dialogue or specify the most important sound effects, background noises, or music cues. Capture the essence of the audio landscape.

Example Analysis: I can clearly hear the interviewer ask a specific question, and the sounds of the city (traffic, people talking) are in the background.
Example Output: Audio: clear interview audio: 'What's the most interesting thing that happened to you today?' with authentic street ambiance
Negative prompt: Based on the video's professional quality and style, specify what should be excluded to prevent common generation errors and maintain authenticity.

Example Analysis: The video is realistic and well-shot. It is not animated, blurry, or staged.
Example Output: Negative prompt: unrealistic, artificial, staged, poor lighting, animation, blurry
Final Output Format:

You must generate the prompt using the exact structure and labels from the example.
Each category (Subject, Context, etc.) must be on a new line and start with the category name followed by a colon.
Do not add any conversational text, preambles, or explanations. Your output should be only the structured prompt itself.`,
        };

        const generationConfig = {
            temperature: 0.2,
            topP: 0.95,
            maxOutputTokens: 8192,
        };

        const reqData: GenerateContentRequest = {
            contents: [{ role: "user", parts: [videoPart, textPart] }],
            generationConfig: generationConfig,
        };

        const resp = await generativeModel.generateContent(reqData);
        const contentResponse = resp.response;

        const candidate = contentResponse.candidates?.[0];
        if (!candidate?.content?.parts?.[0]?.text) {
             throw new Error("Invalid response structure from Gemini API.");
        }

        const newDescription = candidate.content.parts[0].text.replace(/ +/g, " ").trimEnd();

        if (newDescription.includes("Error")) return "(Could not generate a prompt from the video.)";
        else return newDescription;

    } catch (error: any) {
        console.error(JSON.stringify(await truncateLog(error), undefined, 4));
        return {
            error: "Error while getting prompt from Video with Gemini.",
        };
    }
}
