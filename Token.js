const jwt = require("jsonwebtoken");
const { config } = require("dotenv");
config();

const object = { a: "b + c", b: "=" };
let name = "spencer";

function Tokenize(x) {
  const token = jwt.sign({ payload: x }, process.env.SECRET_KEY, {
    expiresIn: "2 days",
  });
  console.log(token);
  

  function verifyToken() {
    const result = jwt.verify(token, process.env.SECRET_KEY);
    console.log(result);
  }
  return verifyToken();
}
Tokenize(object["a"]);
