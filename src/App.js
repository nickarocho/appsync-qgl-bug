import "./App.css";
import { ApolloClient } from "apollo-client";
import gql from "graphql-tag";
import { ApolloLink } from "apollo-link";
import { createAuthLink, AUTH_TYPE, AuthOptions } from "aws-appsync-auth-link";
import { createSubscriptionHandshakeLink } from "aws-appsync-subscription-link";
import { HttpLink } from "apollo-link-http";
import awsconfig from "./aws-exports";
import { InMemoryCache } from "apollo-cache-inmemory";
import { listTodos } from "./graphql/queries";
import { createTodo } from "./graphql/mutations";
import {
  onCreateTodo,
  onDeleteTodo,
  onUpdateTodo,
} from "./graphql/subscriptions";
import { Auth } from "@aws-amplify/auth";

const url = awsconfig.aws_appsync_graphqlEndpoint;
const region = awsconfig.aws_appsync_region;
const httpLink = new HttpLink({ uri: url });
const auth = {
  type: "API_KEY",
  apiKey: awsconfig.aws_appsync_apiKey,
};

const client = new ApolloClient({
  link: ApolloLink.from([
    createAuthLink({ url, region, auth }),
    createSubscriptionHandshakeLink({ url, region, auth }, httpLink),
  ]),
  cache: new InMemoryCache(),
});

Auth.configure({
  userPoolId: "us-west-2_ChOwAzA1e",

  // OPTIONAL - Amazon Cognito Web Client ID (26-char alphanumeric string)
  userPoolWebClientId: "72ic8b25vh726eg1ea4qe3d9o5",

  region: "us-west-2",

  oauth: {
    domain: "conitos-mysso.auth.us-west-2.amazoncognito.com",
    scope: [
      "phone",
      "email",
      "profile",
      "openid",
      "aws.cognito.signin.user.admin",
    ],
    redirectSignIn: "https://master.d30988wurr5ri0.amplifyapp.com/",
    redirectSignOut: "https://master.d30988wurr5ri0.amplifyapp.com/",
    responseType: "code", // or 'token', note that REFRESH token will only be generated when the responseType is code
  },
});

function App() {
  async function currentUser() {
    try {
      const user = await Auth.currentUserPoolUser();
      alert(JSON.stringify(user, null, 2));
    } catch (err) {
      alert("No current user");
    }
  }

  function queryTodos() {
    client
      .query({
        query: gql(listTodos),
      })
      .then((data) => console.log(data))
      .catch((error) => console.error(error));
  }

  function create() {
    client
      .mutate({
        mutation: gql(createTodo),
        variables: {
          input: {
            name: `name-${Date.now()}`,
            description: "This is a todo",
          },
        },
      })
      .then((data) => console.log("mutation result", { data }));
  }
  function subscribeTodos() {
    client
      .subscribe({
        query: gql(onCreateTodo),
      })
      .subscribe({
        next: (data) => alert(JSON.stringify({ data }, null, 2)),
        start: (dataStart) => alert(JSON.stringify({ dataStart }, null, 2)),
        error: (dataError) => alert(JSON.stringify({ dataError }, null, 2)),
        complete: () => alert(JSON.stringify("COMPLETE", null, 2)),
      });
    client
      .subscribe({
        query: gql(onUpdateTodo),
      })
      .subscribe({
        next: (data) => console.log("onUpdate", { data }),
        start: (dataStart) => console.log("onUpdate", { dataStart }),
        error: (dataError) => console.log("onUpdate", { dataError }),
        complete: () => console.log("COMPLETE"),
      });
    client
      .subscribe({
        query: gql(onDeleteTodo),
      })
      .subscribe({
        next: (data) => console.log("onDelete", { data }),
        start: (dataStart) => console.log("onDelete", { dataStart }),
        error: (dataError) => console.log("onDelete", { dataError }),
        complete: () => console.log("onDelete", "COMPLETE"),
      });
  }

  return (
    <div className="App">
      <header className="App-header">
        <button onClick={queryTodos}>Query todos</button>
        <button onClick={create}>Create todos</button>
        <button onClick={subscribeTodos}>Subscribe todos</button>
        <button onClick={() => Auth.federatedSignIn()}>Sign In</button>
        <button onClick={currentUser}>Current User</button>
      </header>
    </div>
  );
}

export default App;
