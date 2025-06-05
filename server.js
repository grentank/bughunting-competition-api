const { GigaChat } = require('langchain-gigachat');
const { HumanMessage, SystemMessage, AIMessage } = require('@langchain/core/messages');
const express = require('express');
const { Agent } = require('https');
const cors = require('cors');
const app = express();
require('dotenv').config();

app.use(cors());
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

async function validateController(req, res) {
  const { question, correctAnswer, userAnswer } = req.body;
  const systemPrompt = `
Ты являешься AI ассистентом, который проверяет ответ пользователя на задание.
Задание заключается в том, чтобы найти ошибку в коде на javascript.
Анализировать код тебе не нужно, а нужно проверить, совпадает ли ответ пользователя с правильным ответом.

### Фрагмент кода

\`\`\`js
${question}
\`\`\`

### Причина, почему этот код не работает

${correctAnswer}

### Что от тебя потребуется

Ниже будет ответ пользователя, который попробует описать, почему код неверный.
Ответ пользователя не будет точно совпадать символ-в-символ с правильным ответом.
Тем не менее, ты должен проверить, совпадает ли по смыслу ответ пользователя с правильным ответом.
Пользователь должен описать механизм ошибки, почему код неверный.
Если пользователь просто указал на ошибку, но не описал механику -- это неверный ответ.

### Формат ответа

Всегда возвращай json объект с булевым полем result. 
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
  const response = await giga.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(`Мой ответ, почему вышеуказанный код неверный: ${userAnswer}`),
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
