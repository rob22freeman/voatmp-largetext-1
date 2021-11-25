# CLI tools

## Prerequisites

- You must have Power Platform CLI (PP CLI), standalone, installed - https://docs.microsoft.com/en-us/powerapps/developer/data-platform/powerapps-cli#standalone-power-platform-cli
- Your PP CLI must be pointed at the Dataverse instance the portal is hosted on - Follow steps 1-3 of https://docs.microsoft.com/en-us/powerapps/developer/component-framework/import-custom-controls#connecting-to-your-environment
- You mush have Visual Studio 2019 installed

## Tool descriptions

- pap-pull.cmd - Delete local copy of portal schema and download latest from the portal

- pap-push.cmd - Push the local copy of the portal schema to the portal

- sync-src-to-portal.cmd - Update portal schema, then copy files from Src folder into appropriate portal schema location and push the portal schema to the portal

#### Utility scripts

copy-src-to-schema.cmd - Script to copy files in Src folder to appropriate portal schema location

copycmd.cmd - Wrapper for copy command

environment-variables.cmd - Environment specific constants

## Usage

1. Make your changes in Src files
2. Push changes to portal using sync-src-to-portal.cmd
3. Push schema and Src changes to Git