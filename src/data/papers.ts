// Selected papers written in collaboration (not first-author), shown on the
// home page. Edit this list as new papers come out.
export interface PaperEntry {
  title: string
  authors: string
  venue?: string
  url?: string
}

export const SELECTED_PAPERS: PaperEntry[] = [
  {
    title: 'Multi-Scenario Causal Discovery for Time-Series Analysis in Dynamic Systems',
    authors:
      'Esmin, A., Castro, M., Souza, B.C.D.O., Lustosa, A., Júnior, P.R.M., Werneck, R.D.O., Gonçalves, M.M., Lusquino Filho, L., Zampieri, M., Morais, E., Linares, O. and Estevam, V.',
    venue: 'IEEE Access, 2026',
    url: 'https://ieeexplore.ieee.org/abstract/document/11482440',
  },
  {
    title: 'Rock-type classification: A (critical) machine-learning perspective',
    authors:
      'Júnior, P.R.M., Salavati, S., Linares, O., Goncalves, M.M., Zampieri, M.F., de Sousa Ferreira, V.H., Castro, M., de Oliveira Werneck, R., Moura, R., Morais, E. and Esmin, A.',
    venue: 'Computers & Geosciences, 193, p.105730, 2024',
    url: 'https://www.sciencedirect.com/science/article/abs/pii/S0098300424002139',
  },
  {
    title: 'A multi-modal approach for mixed-frequency time series forecasting',
    authors:
      'Filho, L.L., de Oliveira Werneck, R., Castro, M., Ribeiro Mendes Júnior, P., Lustosa, A., Zampieri, M., Linares, O., Moura, R., Morais, E., Amaral, M. and Salavati, S.',
    venue: 'Neural Computing and Applications, 36(34), pp.21581-21605, 2024',
    url: 'https://link.springer.com/article/10.1007/s00521-024-10305-z',
  },
  {
    title: 'Watch the reservoir! Improving short-term production forecast through transformers',
    authors:
      'Werneck, R., Lusquino Filho, L.A., Lustosa, A., Loomba, A., Gonçalves, M.M., Esmin, A., Salavati, S., Morais, E., Mendes Junior, P.R., Zampieri, M. and Amaral, M.',
    venue: 'SPE Europec featured at EAGE Conference and Exhibition (p. D031S016R002), SPE, 2024',
    url: 'https://onepetro.org/SPEEURO/proceedings-abstract/24EURO/24EURO/D031S016R002/546302',
  },
  {
    title:
      'Enhancing short-term production forecast in oil fields: Integrating data-driven and model-based approaches to reduce uncertainty',
    authors:
      'Gonçalves, M.M., Werneck, R., Castro, M., Amaral, M., Mendes, P.R., Filho, L.L., Esmin, A., Moura, R., Morais, E., Linares, O.C. and Lustosa, A.',
    venue: 'SPE Europec featured at EAGE Conference and Exhibition (p. D031S019R002), SPE, 2024',
    url: 'https://onepetro.org/SPEEURO/proceedings-abstract/24EURO/24EURO/D031S019R002/546525',
  },
]
