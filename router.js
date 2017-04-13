const Router = {
  routes: [],
  mode: null,
  root: '/',

  config: function(options = {}) {
    const self = this
    self.mode = options.mode || (!!(history.pushState) ? 'history' : 'hash')
    self.root = options && options.root
      ? '/' + self.deleteSlashes(options.root) + '/'
      : '/'
    return self
  },

  getCurrentPath: function() {
    const self = this
    let path = ''
    if (self.mode === 'history') {
      path = self.deleteSlashes(decodeURI(location.pathname + location.search))
      path = path.replace(/\?(.*)$/, '')
      path = self.root !== '/'
        ? path.replace(self.root, '')
        : path
    } else {
      const match = location.href.match(/#(.*)$/)
      path = match ? match[1] : ''
    }
    return self.deleteSlashes(path)
  },

  deleteSlashes: function(path) {
    return path.toString().replace(/\/$/, '').replace(/^\//, '')
  },

  add: function(re, onEnter = () => {}, onExit = () => {}) {
    const self = this
    self.routes.push({ re, onEnter, onExit })
    self.check()
    return self
  },

  check: function(current = this.getCurrentPath(), previous = null) {
    const self = this
    for (let i = 0; i < self.routes.length; i++) {
      const route = self.routes[i]
      if (previous && route.re.test(previous)) {
        route.onExit(current, previous)
      }
      if (route.re.test(current)) {
        route.onEnter(current, previous)
      }
    }
    return self
  },

  listen: function() {
    const self = this
    let previous = self.getCurrentPath()
    const fn = () => {
      const current = self.getCurrentPath()
      if (previous !== current) {
        self.check(current, previous)
        previous = current
      }
    }
    clearInterval(self.interval)
    self.interval = setInterval(fn, 50)
    if (self.mode === 'history') {
      self.setClickHandler()
    }
    return self
  },

  navigate: function(path) {
    const self = this
    path = path ? path : ''
    if (self.mode === 'history') {
      history.pushState(null, '', self.root + self.deleteSlashes(path))
    } else {
      location.href = location.href.replace(/#(.*)$/, '') + '#' + path
    }
    return self
  },

  clickHandler: function(e) {
    const self = this
    const getTarget = (el) => {
      return el.pathname ? el : getTarget(el.parentElement)
    }
    const target = getTarget(e.target)
    const path = target.pathname
    if (location.hostname === target.hostname || path === 'undefined') {
      for (let i = 0; i < self.routes.length; i++) {
        if (path.match(new RegExp(self.routes[i].re))) {
          e.preventDefault()
          return self.navigate(path.replace(self.root, ''))
        }
      }
    }
    return self
  },

  setClickHandler: function(){
    const self = this
    const links = document.getElementsByTagName('a')
    for (let i = 0; i < links.length; i++) {
      links[i].addEventListener('click', self.clickHandler.bind(self), false)
    }
    return self
  }

}

// const root = location.host === 'localhost' ? 'project-folder/dist/' : '/'
Router.config({root: '/', mode: 'hash'}).check().listen()

