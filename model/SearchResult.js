function SearchResult(title, subtitle, action_url, image_url) {
  return {
    attachment: {
      type: "template",
      payload: {
        template_type: "generic",
        elements: [
          {
            title: title,
            subtitle: subtitle,
            image_url: image_url,
            default_action: {
              type: "web_url",
              url: action_url,
              messenger_extensions: false,
              webview_height_ratio: "tall"
            },
            buttons: [
              {
                type: "postback",
                title: "Merci!",
                payload: "yes"
              },
              {
                type: "postback",
                title: "Ce n'est pas ça!",
                payload: "no"
              }
            ]
          }
        ]
      }
    }
  };
}

module.exports = SearchResult;
