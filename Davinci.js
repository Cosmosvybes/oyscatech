// const OpenAIApi = require("openai-api");
const { Configuration, OpenAIApi } = require("openai");
const { config } = require("dotenv");
config();

const configuration = new Configuration({ apiKey: process.env.OPEN_AI_KEY });
const openai = new OpenAIApi(configuration);

const daVinci = async (question) => {
  const gptResponse = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: question,
    max_tokens: 1000,
  });

  return gptResponse.data.choices[0].text;
};

module.exports = { daVinci };


