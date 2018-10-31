const secret = process.env.FAQ_SECRET;
const userId = process.env.FAQ_USER_ID;
const faqUrl = process.env.FAQ_URL;
const prismaService = process.env.PRISMA_SERVICE;

const jwt = require("jsonwebtoken"),
  request = require("request");

const faq = (text, first = 10, skip = 0) => {
  console.log("faq : text:", text, first, skip);

  const query = `{
    search(text: "${text}", first: ${first}, skip:${skip}) {
      nodes {
        id
        question {
          id
          slug
          title
        }
        answer {
          content
        }
      }
    }
  }`;

  return new Promise((resolve, reject) => {
    try {
      //request a new token before each call to the FAQ's api
      const token = jwt.sign({ userId, prismaService }, secret);

      console.log("faq : token:", token);

      // Send the HTTP request to the FAQ's API
      request(
        {
          method: "POST",
          uri: faqUrl,
          headers: {
            Authorization: `API ${token}`,
            "prisma-service": prismaService
          },
          json: { query }
        },
        (err, res, body) => {
          if (err) reject(error);

          if (res.statusCode !== 200)
            reject(new Error(res.statusCode + " " + res.statusMessage));

          resolve(body.data);
        }
      );
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = faq;
