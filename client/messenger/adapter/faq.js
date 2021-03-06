const faqUrl = process.env.FAQ_URL;
const faqName = 'FAQ';

const Caroussel = require('../model/Caroussel'),
  SearchResult = require('../model/SearchResult'),
  UnsatisfactorySearch = require('../model/UnsatisfactorySearch');

const faq = require('../../../api/faq');

// Transform each result node into a SearchResult object.
// Return a Caroussel object filled with the created SearchResult objects.
// Return an UnsatisfactorySearch Object if there is no result
function searchFaq(context, nodes = [], max = 9) {
  return new Promise(async (resolve, reject) => {
    let message;

    const { search } = await faq(context);

    if (search && search.nodes && search.nodes.length > 0) {
      const { nodes } = search;

      const results = nodes
        .map(({ id, question, answer }) =>
          SearchResult(
            context,
            question ? question.title || '' : 'Pas de question',
            answer ? answer.content || '' : 'Question sans réponse',
            `${faqUrl}/${question ? 'q/' + (question.slug + '-' + id) : ''}`,
            faqUrl,
            faqName
          )
        )
        .slice(0, max);

      results.push(
        SearchResult(
          context,
          context,
          'Voir la liste complète des résultats dans FAQ.',
          `${faqUrl}/?q=${context}`,
          faqUrl,
          faqName
        )
      );

      message = Caroussel(results);
    } else {
      message = UnsatisfactorySearch(
        context,
        `Désolé! Je n'ai rien trouvé 😭\nTu peux toujours faire ça :`,
        faqUrl,
        faqName
      );
    }

    resolve(message);
  });
}

module.exports = searchFaq;
