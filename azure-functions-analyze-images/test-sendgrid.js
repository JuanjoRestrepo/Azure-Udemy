const sgMail = require('@sendgrid/mail');
const localSettings = require('./local.settings.json');

const apiKey = localSettings.Values.SENDGRID_API_KEY;
const toEmail = localSettings.Values.SENDGRID_TO_EMAIL || 'juan.restrepo@inchcape.com';
const fromEmail = localSettings.Values.SENDGRID_FROM_EMAIL || 'restrepojuanjo@gmail.com';

sgMail.setApiKey(apiKey);

const msg = {
  to: toEmail,
  from: fromEmail,
  subject: 'Enviando Email SendGrid con Node.js Papi',
  text: 'Entonces que papi? Melo caramelo?',
  html: '<strong>and easy to do anywhere, even with Node.js</strong>',
};

console.log(`Sending email from ${fromEmail} to ${toEmail}...`);

sgMail
  .send(msg)
  .then((response) => {
    console.log('StatusCode:', response[0].statusCode);
    console.log('Headers:', response[0].headers);
    console.log('Email sent successfully via SendGrid!');
  })
  .catch((error) => {
    console.error('Error sending email:');
    if (error.response) {
      console.error(JSON.stringify(error.response.body, null, 2));
    } else {
      console.error(error.message);
    }
  });
