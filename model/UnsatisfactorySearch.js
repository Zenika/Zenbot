function UnsatisfactorySearch() {
  return {
    attachment: {
      type: "template",
      payload: {
        template_type: "button",
        text: "Arghh! Je te propose de faire ça:",
        buttons: [
          {
            type: "postback",
            title: "Reformuler la recherche",
            payload: "start_search"
          },
          {
            type: "postback",
            title: "Partager sur Workplace",
            payload: "share_search"
          },
          {
            type: "web_url",
            title: "Accéder à la FAQ",
            url: "https://faq.zenika.com/"
          }
        ]
      }
    }
  };
}

module.exports = UnsatisfactorySearch;
