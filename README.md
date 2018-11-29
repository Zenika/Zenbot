# Zenbot - Un chatbot qui répond aux questions en consultant la FAQ.

Zenbot permet l'intégration (interfaçage) de l'API de la [FAQ de Zenika](https://faq.zenika.com) au sein de messageries instantanées telles que Messenger ou Slack .

_Ce Readme présente la démarche qui a permis de créer et d'intégrer Zenbot aux plateformes [Messenger](https://developers.facebook.com/docs/messenger-platform) et [Slack](https://api.slack.com)._

## Etape 1 : La configuration d'une application

La première étape de création d'un bot passe par la configuration d'une application qui représentera le bot et contrôlera ses accès sur la plateforme concernée.
Cette configuration se fait manuellement au niveau de chaque plateforme.
Elle permet de définir tout un tas d'informations sur le bot telles que son nom, une description, les différentes permissions qui lui sont accordées, etc.

#### Workplace

Sur Workplace, il s'agit de créer une **"Custom Intégration"**.
Lorqsu'on crée une **"custom intération"**, 2 objets sont en fait crées :

- Une application (avec des autorisations qui lui sont spécifiques).
- Une page de type **Bot** (uniquement visible au sein de votre communauté Workplace).
  Cette page servira entre autre de point d'entrée et de découverte de votre bot sur workplace.

Pendant la configuration, il vous sera demandé plusieurs informations sur votre bot dont l'URL sur laquelle le contacter. Nous verrons comment obtenir cette URL à l'étape 3.
A l'issue de cette configuration, un **token (Custom Integration token)** est généré.
Ce token servira par la suite à légitimer toute les actions de votre **webhook** en tant que bot associé à l'application que vous venez de créer.
Conservez le précieusement et ne le divulguez qu'aux personnes de confiance (ex: l'équipe de développement).
Nous verons dans la suite de ce readme, comment utiliser ce token.

![alt text](https://github.com/Zenika/Zenbot/blob/dev/docs/custom_integration_token.png "custom integration token")

Vous trouverez plus de détails sur la création d'une application Workplace ici: [Creating Apps for Workplace](https://developers.facebook.com/docs/workplace/integrations/custom-integrations/apps).

#### Slack

Pour ce qui est de l'intégration de Zenbot dans Slack, nous avons fait le choix d'utiliser les **Slash Commands**.
Les **Slash Commands** permettent à l'utilisateur d'effectuer des actions (dans notre cas des recherches) en tapant des commandes depuis slack.
Par exemple, pour consulter la FAQ à propos des "notes de frais" l'utilisateur pourra taper la commande _"/faq note de frais"_ depuis slack; il verra alors s'afficher une liste de résultats correspondant à sa recherche.

La page [Mes Applications](https://api.slack.com/apps) liste l'ensemble des applications que vous possédez sur Slack.
Pour en créer une nouvelle, il suffit de cliquer sur le bouton **"Create New App"** depuis cette page, puis renseigner le nom de l' application et l'espace de travail (**Development Slack Workspace**) auquel elle sera associée.

Une fois l'application créée, il va falloir la configurer.
Pour ce faire, il faut se rendre sur la page de configuration de l'application en cliquant sur son nom dans la liste des applications.
La page de configuration contient nombre d'informations sur l'application dont son identifiant (**App Id**), le token de vérification(**Verification Token**), etc.
Cette page permet également de gérer les permissions ainsi que les différentes features (**Bot**, **Slash Commands**, etc) dont vous aurez besoin pour faire fonctionner votre application.

Pour faire tourner Zenbot nous avons eu besoin d'activer 2 features :

- **Incoming Webhooks** : permet de poster des messages dans Slack depuis une source externe.
- **Slash Commands** : permet aux utilisateurs d'effectuer des actions en tapant des commandes.
  Cette feature nécessite d'être configurée en renseignant :

  - un nom de commande (ex : _/faq_)
  - une url de requête (l'url que Slack contactera à chaque fois qu'un utilisateur entrera la commande _/faq_). Nous verrons à l'étape 3 comment obtenir cette url.
  - une courte description de la commande
  - une instruction d'utilisation (court message expliquant comment utiliser la commande).

  ![alt text](https://github.com/Zenika/Zenbot/blob/dev/docs/slash_commands.png "slash-command /faq")

Une fois que la configurations de l'application et ses commandes terminées, il vous faudra installer l'application depuis le volet **"Install your app to your workspace"**.
Vous pourrez également choisir de distribuer votre application sur Slack, au delà de votre espace de travail.

Pour de plus amples précisions sur la création d'une application, vous pouvez consulter ceci: [Building Slack apps](https://api.slack.com/slack-apps).

And Voilà! Vous savez désormais configurer une application Slack ou Workplace. Nous allons maintenant voir comment coder un **webhook** pour répondre aux reqûetes des utilisateurs.

## Etape 2 : La création de Webhooks

Un [webhook](https://en.wikipedia.org/wiki/Webhook) est une fonction de rappel HTTP (user-defined HTTP callback) généralement déclenchées lors d'un évènement (dans notre cas l'envoi d'un message à notre bot).
Pour faire simple notre webhook jouera le rôle d'intermédiaire entre notre chatbot et la FAQ Zenika.
Il nous permettra de recevoir, gérer et envoyer des messages.
A chaque fois qu'un utilisateur écrira un message à notre bot, il sera envoyé au webhook qui effectuera une recherche auprès de l'Api de la FAQ, puis retournera une réponse (le plus souvent au format JSON) à l'utilisateur.

La création de notre webhook consiste à ajouter quelques points de terminaison (endpoints) à un serveur HTTP comme [Express](https://expressjs.com/fr/) par exemple.

#### Workplace

La configuration du webhook sur Workplace se fait en 2 étapes :

- L'ajout du endpoint de vérification du webhook. Sur ce endpoint seront envoyées des requêtes de type GET servant à vérifier le token défini lors de la création de la **"Custom Intégration"** vue à l'étape 1.
  Cette étape est requise par la plateforme Messenger pour garantir l'authenticité de notre webhook.

- L'ajout du endpoint principal.
  Sur ce endpoint seront envoyées des requêtes de type POST correspondant aux messages envoyés par les utilisateurs.

Vous trouverez plus de détails sur la configuration du webhook ici : [webhook setup](https://developers.facebook.com/docs/messenger-platform/getting-started/webhook-setup/).

Messenger définit 2 types d'évènements entrant: les **messages** et les **postbacks**.
Les messages représentent les messages textuels écrits par l'utilisateur (textos) tandis que les postbacks sont des retours (clic sur un bouton envoyé par le webhook par exemple).
Une fois notre endpoint principal configuré, nous aurons besoin de lui ajouter des fonctions de gestion d'évènements :

- une fonction _handleMessage_ pour gerer les textos.
- une fonction _handlePostback_ pour gerer les retours (clic boutons, sélections, etc).
- une fonction _callSendAPI_ permettant d'envoyer des messages à l'utilisateur via l'API Send de Messenger.

```Javascript
// Handles messages events
function handleMessage(sender_psid, received_message) {
     let response = {};
    //...
    callSendAPI(sender_psid, response);
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
    let response = {};
    //...
    callSendAPI(sender_psid, response);
}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {}
```

Ce qu'il faut retenir, c'est qu'on appelle toujours la fonction _callSendAPI_ pour envoyer une reponse lors de la réception d'un texto ou d'un retour.
Pour finir, il ne nous reste plus qu'à définir la structure de nos réponses. Celles-ci sont généralement au format JSON.
Messenger dispose d'une grande variété de [templates](https://developers.facebook.com/docs/messenger-platform/send-messages/templates) prédéfinis pour nous aider à contruire nos messages de réponse.
On peut ainsi, envoyer un simple textos :

```Javascript
    response = {
      "text": `Hello! Je suis Zenbot 😊.`
    }
```

ou bien un riche message composé d'un titre, d'une image et de boutons :

```Javascript
response = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": "Is this the right picture?",
            "subtitle": "Tap a button to answer.",
            "image_url": attachment_url,
            "buttons": [
              {
                "type": "postback",
                "title": "Yes!",
                "payload": "yes",
              },
              {
                "type": "postback",
                "title": "No!",
                "payload": "no",
              }
            ],
          }]
        }
      }
    }
```

Vous connaissez maintenant les grandes lignes de la création d'un webhook pour la plateforme Messenger.
Vous trouverez ici ([quick start](https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start)) un tutoriel complet sur la conception d'un bot Messenger.

#### Slack

Pour rappel, nous avons fait le choix d'utiliser les slash-commands pour implémenter notre bot sur Slack.
Les slash-commands sont envoyées de la même manière qu'un message classique depuis la barre d'envoi des messages.
Cependant les slash-commands ne sont pas à proprement parler des messages.
La soumission d'une slash-command entraînera l'envoi à notre webhook d'une requête POST contenant en son corps une charge utile de données (payload).

Sur Slack, la création du webhook fonctionne à peu près de la même manière que sur Messenger.
Il s'agit toujours de créer un ou plusieurs endpoints sur un serveur HTTP.
Ces endpoints recevront les charges utliles envoyées lors des soumissions de la commande _/faq_ puis retourneront une réponse au format JSON.

> A noter que sur slack, la [vérification du webhook](https://api.slack.com/docs/verifying-requests-from-slack) est possible mais pas obligatoire.

Pour tout savoir du fonctionnement d'une slash-command et de l'implémentation de son webhook associé, ça se passe ici : [Slash Commands](https://api.slack.com/slash-commands).

Tout comme Messenger, Slack dispose d'un système de templating pour les réponses au format JSON. Ce système de templating va nous aider à structurer et enrichir nos messages.
En plus de la structuration des messages, slack offre une grande variété d'outils de formatage des messages incluant le formatage des dates, l'ajout de fragments de code, etc.
La page "[An introduction to messages](https://api.slack.com/docs/messages)" explique en détail comment composer un message structuré.
Il est également possible de trouver sur le compte github de Slack une [feuille de route](https://github.com/slackapi/slack-platform-assets) des templates les plus communément utilisés.

Voilà pour ce qu'il en est de la création d'un webhook pour slack.
Vous trouverez plus de détails sur les intégrations Slack en général ici : [Building internal integrations for your workspace](https://api.slack.com/internal-integrations).

Nous avons fini de configurer notre webhook, il faut maintenant le déployer pour le rendre disponibles sur web.

## Etape 3 : Le déploiement

Pour déployer notre webhook, nous avons choisi d'utiliser la solution d'hébergement [Clever-cloud](https://www.clever-cloud.com/en/).
Clever Cloud fournit aux développeurs une plate-forme d'automatisation informatique avec une infrastructure robuste et une mise à l'échelle automatique.
L'avantage d'utiliser Clever-cloud réside dans l'automatisation, surtout l'automatisation du déploiement de chaque nouvelle version de notre bot.
En effet, nous n'avons pas eu besoin d'utiliser d'outils d'intégration continue (CI).
Une fois Clever-cloud connecté au repository git du projet, un simple _push_ sur la branche _master_ déclenche un redéploiement.
Dans cette étape nous expliquerons commennt déployer notre webhook sur Clever-cloud.
Depuis le tableau de bord (une fois loggué, et les organisations renseignées), il est possible de créer une nouvelle application. Pour ce faire, il faut:

- cliquer sur le boutton : "**create**"
  - puis choisir "**an application**"
    - et enfin selectionner le repository du projet à partir du menu déroulant "**Select your Github repository**" .
- Définir le type d'application que représente notre projet en choisissant _**Node**_ parmi la liste proposée.
- Choisir le nombre d'instances nécessaires.
- On peut ensuite ajouter une description et une région (de préference pour l'hébergement), puis cliquer sur "**CREATE**" pour lancer la création de notre application sur Clever-cloud.
- Nous n'avons pas besoin d' _add-on_, nous pouvons donc passer l'étape correspondante et cliquer sur _next_.
- Enfin, il nous est demandé de définir un certain nombre de variables d'environnement.
  C'est le parfait endroit pour renseigner toutes les valeurs en dur de votre bot comme par exemple le _token de verification_ qui doit rester confidentiel.
  Il faut finalement cliquer sur _Next_ pour lancer le déploiement de notre application sur un serveur.

La vidéo _NodeJS Mongo demo_ résume bien ces différentes étapes de création d'une application sur Clever-cloud:
[![IMAGE ALT TEXT HERE](https://github.com/Zenika/Zenbot/blob/dev/docs/clever-cloud.png)](https://static-assets.cellar.services.clever-cloud.com/website/home/powerful-features-videos/deploy.mp4)

Si tout s'est bien passé, une notification nous averti que le déploiement de notre application a été un succes.
Yay! Notre bot est en ligne.
Mais attention ce n'est pas encore fini.
Nous devons encore récupérer l'URL sur laquelle notre bot a été déployé et la renseigner dans la configuration de la plateforme d'intégration de notre bot (Messenger/Slack) comme vu à l'étape 1.
L'URL de déploiement est disponible et configurable à partir du menu "**_Domaine names_**" de notre application sur le tableaude bord Clever-cloud.

C'est terminé!
Nous pouvons maintenant tester que tout fonctionne correctement en écrivant quelques messages à notre bot depuis Messenger ou bien en tapant la commandes _/faq_ sur Slack! Et, petite cerise sur le gateau, ils est possible de configurer un message de bienvenu sur Messenger en suivant les instructions de la page [Welcome screen](https://developers.facebook.com/docs/messenger-platform/discovery/welcome-screen/).
