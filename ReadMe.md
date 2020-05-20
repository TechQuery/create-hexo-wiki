# Hexo Wiki

**Wiki-site** generator based on [Hexo][1] & [Git][2].

[![NPM Dependency](https://david-dm.org/TechQuery/create-hexo-wiki.svg)][4]
[![Build Status](https://travis-ci.com/EasyWebApp/create-hexo-wiki.svg?branch=master)][5]

[![NPM](https://nodei.co/npm/create-hexo-wiki.png?downloads=true&downloadRank=true&stars=true)][6]

## Basic Usage

### 1. Choose a Theme & Plugins

-   https://hexo.io/themes/

    -   You should find out which pages must be created to enable some layout of chosen theme

-   https://hexo.io/plugins/ ([Some plugins][7] have been included)

### 2. Create a Git repository

https://github.com/new

### 3. Install Hexo-wiki

```Shell
npm init hexo-wiki create repo_name \
    --theme name \
    --pages blog,tags \
    --plugins one,two \
    --remote https://github.com/your_id/repo_name.git
```

### 4. Setup Online services

-   [Static Pages host](https://pages.github.com/)

-   [Auto updater](https://github.com/marketplace/travis-ci) ([Environment varibles][8])

### 5. Upload whole site

```Shell
git push
```

## Advanced Arguments

    create-hexo-wiki create <path>

    Create a Hexo Wiki project

    Options:
      -h, --help             show Help information
      -P, --pages    <list>  Required pages of installed theme
      -p, --plugins  <list>  Plugins to install (comma separated)
      -r, --remote   <URL>   Git URL of a Remote repository
      -t, --theme    <name>  A theme to install

## Reference Documents

-   [Tutorial](https://shimo.im/docs/PcIvVWp7Ok8qnb5X)

-   [Source code](https://github.com/TechQuery/create-hexo-wiki)

[1]: https://hexo.io/
[2]: https://git-scm.com/
[3]: https://developers.google.com/web/progressive-web-apps/
[4]: https://david-dm.org/TechQuery/create-hexo-wiki
[5]: https://travis-ci.com/EasyWebApp/create-hexo-wiki
[6]: https://nodei.co/npm/create-hexo-wiki/
[7]: https://github.com/TechQuery/create-hexo-wiki/blob/master/template/package.json#L13
[8]: https://tech-query.me/development/hello-hexo-travis/
