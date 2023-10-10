import {
  readConfig,
  recursiveMerge,
  REG_FONT,
  REG_IMAGE,
  REG_MEDIA,
  resolveMainFilePath,
  resolveScriptPath
} from '@tarojs/helper'
import { ViteH5BuildConfig, ViteH5CompilerContext } from '@tarojs/taro/types/compile/viteCompilerContext'
import path from 'path'

import defaultConfig from '../../defaultConfig/defaultConfig.h5'
import { CompilerContext } from './base'

import type { PageConfig } from '@tarojs/taro'

export class TaroCompilerContext extends CompilerContext<ViteH5BuildConfig> implements ViteH5CompilerContext {
  routerMeta: {
    routerCreator: string
    getRoutesConfig: (pageName?: string) => string
  }

  constructor (appPath: string, taroConfig: ViteH5BuildConfig) {
    super(appPath, taroConfig)
    this.app = this.getApp()
    this.pages = this.getPages()
  }

  processConfig () {
    const staticDirectory = this.rawTaroConfig.staticDirectory || defaultConfig.staticDirectory as string
    defaultConfig.imageUrlLoaderOption!.name =
      (filename: string) => path.join(staticDirectory, 'images', path.basename(filename))
    defaultConfig.fontUrlLoaderOption!.name =
      (filename: string) => path.join(staticDirectory, 'fonts', path.basename(filename))
    defaultConfig.mediaUrlLoaderOption!.name =
      (filename: string) => path.join(staticDirectory, 'media', path.basename(filename))
    defaultConfig.output!.assetFileNames = ({ name }) => {
      if (!name) return '[ext]/[name].[hash][extname]'
      if (REG_IMAGE.test(name)) return `${staticDirectory}/images/${name}`
      if (REG_MEDIA.test(name)) return `${staticDirectory}/media/${name}`
      if (REG_FONT.test(name)) return `${staticDirectory}/fonts/${name}`
      return '[ext]/[name].[hash][extname]'
    }
    this.taroConfig = recursiveMerge({}, defaultConfig, this.rawTaroConfig)
  }

  getAppScriptPath (): string {
    const entry = this.taroConfig.entry.app[0].replace(/\.config$/, '')
    return resolveScriptPath(entry)
  }

  compilePage = (pageName: string) => {
    const { sourceDir, frameworkExts } = this

    const scriptPath = resolveMainFilePath(path.join(sourceDir, pageName), frameworkExts)
    const configPath = this.getConfigFilePath(scriptPath)
    const config: PageConfig = readConfig(configPath) || {}

    const pageMeta = {
      name: pageName,
      scriptPath,
      configPath,
      config,
      isNative: false,
    }

    this.filesConfig[this.getConfigFilePath(pageMeta.name)] = {
      path: configPath,
      content: config
    }

    this.configFileList.push(pageMeta.configPath)
    return pageMeta
  }
}