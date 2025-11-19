import path from "node:path";
import { Eta } from "eta";

interface TemplateData {
  static_url: string;
  include_footer: boolean;
}

export const defaultData: TemplateData = {
  static_url: process.env.URL ?? "https://newsletter.bedstuystrong.com",
  include_footer: true,
};

const eta = new Eta();

export const makeOptions = (
  filePath?: string,
  data?: Partial<TemplateData>
) => ({
  // rawMJML is the raw MJML XML, as saved in the .mjml files
  // the output should be transformed XML - still MJML, with any of our changes made
  preprocessors: [
    (rawMJML) => eta.renderString(rawMJML, { ...defaultData, ...data }),
  ],
  packages: [],
  filePath,
});

export const buildEmail = (emailName: string) => {};
