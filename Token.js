// ARAMIDE BLESSING OLATUNDE
//MATRIC NUMBER:HND/210961
const jwt = require("jsonwebtoken"); // using javascript package known as jsonwebtoken
const { config } = require("dotenv"); //.env package to store our secret keys
config(); // initialize the dotenv.

const objectItem = {
  c: "3+3",
  character: "@",
  expression: `${3 * 6}`,
};
const lexicalAnalyzer = (expression) => {
  //take strings of characters or object expression and assign a token to each  input denoted as payload
  const token = jwt.sign({ payload: expression }, process.env.SECRET_KEY, {});

  //the verify the generated token for each payload identified in the source code
  function verifyToken() {
    const tokenMetaData = jwt.verify(token, process.env.SECRET_KEY);
    return { expression, tokenMetaData };
  }
  // then return the output which are the expression and the token generated
  return {
    details: verifyToken().tokenMetaData,
    token,
  };
};
function inputAnalyzer(objectData) {
  Object.entries(objectData).forEach((obj) => {
    console.log(lexicalAnalyzer(obj[0]));
    console.log(lexicalAnalyzer(obj[1]));
  });
}
inputAnalyzer(objectItem);
/* the output we have the expression Fdetails and the token generated for it. 
which produces the payload and iat time of issuance */
