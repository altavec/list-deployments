const github = require('@actions/github');
const core = require('@actions/core');


type DeploymentState =
  | "error"
  | "failure"
  | "inactive"
  | "in_progress"
  | "queued"
  | "pending"
  | "success";

async function run() {
  try {
    const context = github.context;
    const logUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}/commit/${context.sha}/checks`;

    const token = core.getInput("token", { required: true });
    const environment = core.getInput("environment", { required: false }) || "production";

    const client = new github.GitHub(token, { previews: ["flash", "ant-man"] });

    const query = `
    query($owner: String!, $repo: String!, $environment: String!) {
      repository(owner:$owner, name:$repo) {
        deployments(environments:$environment, first: 50, orderBy: {direction: DESC, field: CREATED_AT}) {
          edges {
            node {
              createdAt
              commit {
                oid
              }
              state
            }
          }
        }
      }
    }`;

    const variables = {
      owner: context.repo.owner,
      repo: context.repo.repo,
      environment: environment
    };

    const deployment = await client.graphql(query, variables);

    console.log(deployment);

    core.setOutput("sha", "as");
  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
}

run();
