// https://code.visualstudio.com/api/working-with-extensions/publishing-extension#vsce

import * as vscode from 'vscode';
import { writeFileSync } from 'fs';
import { normalize } from 'path';
import htmlEncoder, { TargetType } from './htmlEncoder';

type Target = { path: string; type: TargetType; ssr: boolean };
const allTargetsPattern = /(\<\?out(\:ssr)?\s?(.*?)\s?\?\>)*$/gim;
const targetPattern = /out(\:ssr)?\s? (.*?)\s?\?/gm;

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(registerHtmlEncoder('html-encoder'));
}

export function registerHtmlEncoder(selector: vscode.DocumentSelector): vscode.Disposable {
  return vscode.languages.registerDocumentFormattingEditProvider(selector, {
    provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
      let text: string = document.getText();
      const source = getSourcePosition(document.uri.path);
      findTargets(document.uri.path, text).forEach(target => {
        try {
          writeFileSync(target.path, htmlEncoder(text.replace(allTargetsPattern, ''), target.type, target.ssr));
          vscode.window.showInformationMessage(` Encoded ${target.path.replace(source.folder, '.')}`);
        }
        catch (err) {
          console.error(target.path, err);
          vscode.window.showInformationMessage(` Failed encoding ${target.path.replace(source.folder, '.')}: ${err}`);
        }
      });

      return [];
    }
  });
}

function findTargets(sourcePath: string, fullText: string): Target[] {
  const targets: Target[] = [];
  let match;
  try {
    ((fullText.match(allTargetsPattern) || []).filter((s) => s.length) || []).forEach(tag => {
      while (match = targetPattern.exec(tag)) {
        const target = match[0].split(/\s+/);
        // target= "out[:ssr] filename ?"
        targets.push({
          type: getTargetType(match[2]),
          path: normalize(getTargetPath(sourcePath, target[1].replace(/\?$/, '').replace(/\.es$/i, '.js'))),
          ssr: !!target[1] && target[1].match(/\s?ssr/i) !== null,
        });
      }
    });
  } catch (err) {
    vscode.window.showInformationMessage(err);
    console.error(err);
  }

  // return default target
  if (!targets.length) {
    targets.push({
      type: 'js',
      ssr: false,
      path: `${sourcePath.replace(/\.html?$/, '')}.js`,
    });
  }

  return targets;
}

function getTargetType(filename: string = ''): TargetType {
  if (filename.match(/\.ts\??$/i) !== null) {
    return 'ts';
  } else if (filename.match(/\.es\??$/i) !== null) {
    return 'es';
  }

  return 'js';
}

function getSourcePosition(source: string) {
  const sourceFileNameIndex = source.lastIndexOf('/');
  return { file: source.substr(sourceFileNameIndex + 1), folder: source.substr(0, sourceFileNameIndex) };
}

function getTargetPath(source: string, target: string) {
  const sourceDetails = getSourcePosition(source);
  if (target.split('*').length === 2) {
    target = target.replace(/\*/, sourceDetails.file.replace(/\.html?$/, ''));
  }
  if (source === target || sourceDetails.file === target) { // same file
    const ext = (source.match(/\.ts$/i) !== null) ? 'ts' : 'js';
    return `${source}.${ext}`;
  } else if (target[0] === '/') { // absolute path
    return target;
  }

  return `${sourceDetails.folder}/${target}`;
}

// this method is called when your extension is deactivated
export function deactivate() { }
