import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { GoogleAICacheManager, GoogleAIFileManager } from "@google/generative-ai/server";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);
const cacheManager = new GoogleAICacheManager(apiKey);
const ttlSeconds = 300;
/**
 * Uploads the given file to Gemini.
 *
 * See https://ai.google.dev/gemini-api/docs/prompting_with_media
 */
async function uploadToGemini(path, mimeType, displayName) {
  const uploadResult = await fileManager.uploadFile(path, {
    mimeType,
    displayName: displayName,
  });
  const file = uploadResult.file;
  console.log(`Uploaded file ${file.displayName} as: ${file.name}`);
  return file;
}

/**
 * Waits for the given files to be active.
 *
 * Some files uploaded to the Gemini API need to be processed before they can
 * be used as prompt inputs. The status can be seen by querying the file's
 * "state" field.
 *
 * This implementation uses a simple blocking polling loop. Production code
 * should probably employ a more sophisticated approach.
 */
async function waitForFilesActive(files) {
  console.log("Waiting for file processing...");
  for (const name of files.map((file) => file.name)) {
    let file = await fileManager.getFile(name);
    while (file.state === "PROCESSING") {
      process.stdout.write(".")
      await new Promise((resolve) => setTimeout(resolve, 10_000));
      file = await fileManager.getFile(name)
    }
    if (file.state !== "ACTIVE") {
      throw Error(`File ${file.name} failed to process`);
    }
  }
  console.log("...all files ready\n");
}

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstruction: "Respond based only on the provided PDF. For 'hi' or 'hello,' reply with a friendly greeting. If the requested information is not in the PDF, say 'The requested information is not available in the provided document.' Always cite the PDF as the source. If a question is ambiguous, respond with 'The document does not provide sufficient information to answer this question.' Do not use external knowledge. If the PDF is unreadable, say 'The document could not be processed. Please ensure the file is clear and accessible.'",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

async function cacheCreation(fileResult) {
  const cache = await cacheManager.create({
    model: "models/gemini-1.5-flash-001",
    systemInstruction: "Respond based only on the provided PDF. For 'hi' or 'hello,' reply with a friendly greeting. If the requested information is not in the PDF, say 'The requested information is not available in the provided document.' Always cite the PDF as the source. If a question is ambiguous, respond with 'The document does not provide sufficient information to answer this question.' Do not use external knowledge. If the PDF is unreadable, say 'The document could not be processed. Please ensure the file is clear and accessible.'",
    contents: [
      {
        role: 'user',
        parts: [
          {
            fileData: {
              mimeType: fileResult.mimeType,
              fileUri: fileResult.uri,
            },
          },
        ],
      },
    ],
    ttlSeconds,
  });

  const genModel = genAI.getGenerativeModelFromCachedContent(cache);
  return genModel;
}

export {
  model,
  generationConfig,
  waitForFilesActive,
  uploadToGemini,
  cacheCreation,
}
