const { Eta } = require('eta');

const placeholderData = {
  name: "Friend",
  assets_url: "https://joyful-torte-1a79b9.netlify.app"
};

const eta = new Eta();

const etaPreprocessor = (rawMJML) => {    
  console.log("preprocessor!")
  return eta.renderString(rawMJML, placeholderData);
}

const options = {
  // rawMJML is the raw MJML XML, as saved in the .mjml files
  // the output should be transformed XML - still MJML, with any of our changes made
  preprocessors: [etaPreprocessor],
  packages: [],
  filePath: './content'
}

module.exports = options;