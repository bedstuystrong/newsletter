import path from "node:path";
import { Eta } from "eta";

interface TemplateData {
  static_url: string;
}

export const defaultData: TemplateData = {
  static_url: "https://joyful-torte-1a79b9.netlify.app",
};

const eta = new Eta();

export const makeOptions = (filePath?: string, data?: TemplateData) => ({
  // rawMJML is the raw MJML XML, as saved in the .mjml files
  // the output should be transformed XML - still MJML, with any of our changes made
  preprocessors: [
    (rawMJML) => eta.renderString(rawMJML, { ...defaultData, ...data }),
  ],
  packages: [],
  filePath,
});
