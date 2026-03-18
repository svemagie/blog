/**
 * CV Data — static mode
 * Edit cvStatic.js to update CV content.
 */

import cvStatic from "./cvStatic.js";

const EMPTY_CV = {
  lastUpdated: null,
  experience: [],
  projects: [],
  skills: {},
  skillTypes: {},
  languages: [],
  education: [],
  interests: {},
  interestTypes: {},
};

export default function () {
  return { ...EMPTY_CV, ...cvStatic };
}
