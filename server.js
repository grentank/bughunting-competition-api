const { GigaChat } = require('langchain-gigachat');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
const express = require('express');
const { Agent } = require('https');
const app = express();
require('dotenv').config();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Приложение проверки ответов пользователей');
});

const httpsAgent = new Agent({
  rejectUnauthorized: false,
});

const giga = new GigaChat({
  credentials: process.env.GIGACHAT_API_KEY,
  model: 'GigaChat-2',
  scope: 'GIGACHAT_API_B2B',
  httpsAgent,
});

const systemPrompt = `
Ты являешься AI ассистентом, который проверяет ответы пользователей на задания.
Задания заключаются в том, чтобы найти ошибку в коде, написанному на javascript.
Сам код проверять не нужно, в нём точно будет ошибка. Тебе будет дан правильный ответ, который ожидается от пользователя.
Пользователь не будет вводить точный символ-в-символ, что дано в правильном ответе, он будет вводить текст, который описывает, в чём ошибка.
Ты должен проверить, совпадает ли ответ пользователя с правильным ответом.
Если совпадает, то верни json объект с полем result. 
Если ответ пользователя совпадает с правильным ответом или ответ пользователя близок по смыслу к правильному ответу, то верни верни json объект с полем result: true, то есть:
\`\`\`json
{
    "result": true
}
\`\`\`
Если ответ пользователя не совпадает по смыслу с правильным ответом, то верни json объект с полем result: false вот так:
\`\`\`json
{
    "result": false
}
\`\`\`
`;

async function validateController(req, res) {
  const { question, correctAnswer, userAnswer } = req.body;
  const response = await giga.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(
      `Изначальный код: ${question}\nПравильный ответ: ${correctAnswer}\nОтвет пользователя: ${userAnswer}`,
    ),
  ]);
  console.log(response.content);
  const parseMarkdown = response.content.replace(/```json/g, '').replace(/```.{0,}/g, '');
  const json = JSON.parse(parseMarkdown);
  console.log(json);
  res.json(json);
}

app.post('/validate-answer', validateController);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
