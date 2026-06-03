import { defineBackend } from "@aws-amplify/backend";
import { RemovalPolicy } from "aws-cdk-lib";
import { AttributeType, BillingMode, ProjectionType, Table } from "aws-cdk-lib/aws-dynamodb";
import { Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";

const backend = defineBackend({});
const dataStack = backend.createStack("wordFinderData");

const dictionaryTable = new Table(dataStack, "DictionaryWords", {
  partitionKey: { name: "word", type: AttributeType.STRING },
  billingMode: BillingMode.PAY_PER_REQUEST,
  removalPolicy: RemovalPolicy.RETAIN,
});

const discoveredTable = new Table(dataStack, "DiscoveredWords", {
  partitionKey: { name: "word", type: AttributeType.STRING },
  billingMode: BillingMode.PAY_PER_REQUEST,
  removalPolicy: RemovalPolicy.RETAIN,
});

discoveredTable.addGlobalSecondaryIndex({
  indexName: "bySearchCount",
  partitionKey: { name: "bucket", type: AttributeType.STRING },
  sortKey: { name: "searchCount", type: AttributeType.NUMBER },
  projectionType: ProjectionType.ALL,
});

discoveredTable.addGlobalSecondaryIndex({
  indexName: "byDiscoveredAt",
  partitionKey: { name: "bucket", type: AttributeType.STRING },
  sortKey: { name: "discoveredAt", type: AttributeType.STRING },
  projectionType: ProjectionType.ALL,
});

const notesTable = new Table(dataStack, "WordNotes", {
  partitionKey: { name: "word", type: AttributeType.STRING },
  sortKey: { name: "noteId", type: AttributeType.STRING },
  billingMode: BillingMode.PAY_PER_REQUEST,
  removalPolicy: RemovalPolicy.RETAIN,
});

notesTable.addGlobalSecondaryIndex({
  indexName: "byIpWord",
  partitionKey: { name: "ipWord", type: AttributeType.STRING },
  sortKey: { name: "createdAt", type: AttributeType.STRING },
  projectionType: ProjectionType.KEYS_ONLY,
});

const dailyStatsTable = new Table(dataStack, "StatsDaily", {
  partitionKey: { name: "day", type: AttributeType.STRING },
  billingMode: BillingMode.PAY_PER_REQUEST,
  removalPolicy: RemovalPolicy.RETAIN,
});

const computeRole = new Role(dataStack, "WordFinderAmplifyComputeRole", {
  assumedBy: new ServicePrincipal("amplify.amazonaws.com"),
  description: "Least-privilege Amplify Hosting SSR compute role for Word Finder API routes.",
});

dictionaryTable.grantReadData(computeRole);
discoveredTable.grantReadWriteData(computeRole);
notesTable.grantReadWriteData(computeRole);
dailyStatsTable.grantReadWriteData(computeRole);

backend.addOutput({
  custom: {
    wordFinderDictionaryTableName: dictionaryTable.tableName,
    wordFinderDiscoveredTableName: discoveredTable.tableName,
    wordFinderNotesTableName: notesTable.tableName,
    wordFinderDailyStatsTableName: dailyStatsTable.tableName,
    wordFinderComputeRoleArn: computeRole.roleArn,
  },
});
