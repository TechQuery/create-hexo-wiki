# Hexo Wiki

**Wiki-site** generator based on [Hexo](https://hexo.io/) & [Git](https://git-scm.com/)

[![NPM Dependency](https://david-dm.org/TechQuery/create-hexo-wiki.svg)](https://david-dm.org/TechQuery/create-hexo-wiki)

[![NPM](https://nodei.co/npm/create-hexo-wiki.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/create-hexo-wiki/)


## Basic Usage

### 1. Choose a Theme & Plugins

 - https://hexo.io/plugins/ ([Some plugins][1] have been included)
 - https://hexo.io/themes/

### 2. Create a Git repository

https://github.com/new

### 3. Install Hexo-wiki

```Shell
npm init hexo-wiki repo_name \
    --theme name \
    --plugins one,two \
    --remote https://github.com/your_id/repo_name.git
```

### 4. Setup Online services

 - [Static Pages host](https://pages.github.com/)
 - [Auto updater](https://github.com/marketplace/travis-ci) ([Environment varibles][2])

### 5. Upload whole site

```Shell
git push
```

## Advanced Arguments

    Usage: create-hexo-wiki [options] [command]

    Wiki-site generator based on Hexo & Git

    Options:
        -V, --version         output the version number
        -p, --plugins <list>  Plugins to install (comma separated)
        -t, --theme <name>    A theme to install
        -r, --remote <URL>    Git URL of a Remote repository
        -h, --help            output usage information

    Commands:
        update                Update list of Plugins & Themes
        help [cmd]            display help for [cmd]


## Reference Documents

 - [Tutorial](https://shimo.im/docs/PcIvVWp7Ok8qnb5X)

 - [Source code](https://github.com/TechQuery/create-hexo-wiki)


 [1]: https://github.com/TechQuery/create-hexo-wiki/blob/master/template/package.json#L13
 [2]: https://tech-query.me/development/hello-hexo-travis/
