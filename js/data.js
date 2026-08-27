const fallbackData = {
  profile: {
    name: 'Quentin F. Davis',
    roles: ['Developer', 'AI Engineer', 'Game Developer', 'Artist'],
    tagline: 'Portfolio content is temporarily unavailable.',
    about: [],
    disciplines: [],
  },
  filters: {},
  contact: {},
  resume: {},
  projects: [],
  skills: [],
  art: [],
  music: [],
};

let portfolioDataPromise;

export async function loadPartial(url, selector) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to load ${url}`);

  const target = document.querySelector(selector);
  if (target) target.innerHTML = await response.text();
}

export function loadPortfolioData() {
  if (!portfolioDataPromise) {
    portfolioDataPromise = fetch('data/portfolio.json')
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load portfolio data.');
        return response.json();
      })
      .catch((error) => {
        console.error(error);
        return fallbackData;
      });
  }

  return portfolioDataPromise;
}
