const { Eta } = require('eta');

const defaultData = {
  static_url: "https://joyful-torte-1a79b9.netlify.app"
};

const eta = new Eta();

const makeOptions = (data) => ({
  // rawMJML is the raw MJML XML, as saved in the .mjml files
  // the output should be transformed XML - still MJML, with any of our changes made
  preprocessors: [(rawMJML) => eta.renderString(rawMJML, {...defaultData, ...data})],
  packages: [],
  filePath: '.'
});

const defaultOptions = makeOptions(defaultData);

defaultOptions.makeOptions = makeOptions;

module.exports = defaultOptions;