import { Eta } from 'eta';

const placeholderData = {
  name: "Friend"
}

const eta = new Eta();

const etaPreprocessor = (rawMJML) => {    
  return eta.renderString(rawMJML, placeholderData);
}

const options = {
  // rawMJML is the raw MJML XML, as saved in the .mjml files
  // the output should be transformed XML - still MJML, with any of our changes made
  preprocessors: [etaPreprocessor],
  packages: []
}

module.exports = options;
