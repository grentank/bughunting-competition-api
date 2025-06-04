async function test() {
  const response = await fetch(
    'https://bughunting-competition-api.onrender.com/validate-answer',
    {
      method: 'POST',
      body: JSON.stringify({
        question: 'const name = "Bob"; name = "Carl";',
        correctAnswer:
          'В javascript нельзя менять значение переменной, которая была объялена через const',
        userAnswer: 'нужно объявлять через var',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
  const data = await response.json();
  console.log(data);
}

test();
