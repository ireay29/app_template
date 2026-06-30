export default {
  '*.{cjs,js,jsx,mjs,ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{css,json,jsonc,md,yaml,yml}': ['prettier --write'],
};
