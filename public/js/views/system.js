/*global Backbone:true, $:true, _:true, async:true, App:true, _webapp:true */
/*jshint multistr:true */
/*jshint browser:true */
/*jshint strict:false */

/*
  * WiConnect Web App, WiConnect JS API Library & WiConnect JS Build System
  *
  * Copyright (C) 2015, Sensors.com, Inc.
  * All Rights Reserved.
  *
  * The WiConnect Web App, WiConnect JavaScript API and WiConnect JS build system
  * are provided free of charge by Sensors.com. The combined source code, and
  * all derivatives, are licensed by Sensors.com SOLELY for use with devices
  * manufactured by ACKme Networks, or approved by Sensors.com.
  *
  * THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS AND ANY EXPRESS OR IMPLIED
  * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
  * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
  * SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
  * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT
  * OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
  * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
  * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
  * IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY
  * OF SUCH DAMAGE.
*/

App.Views.System = Backbone.View.extend({
  els: [],
  views: [],
  poll: null,

  template: _.template('\
<div class="content">\
<h1>System</h1>\
<div>\
<h4>Version</h4>\
<input name="version" value="<%- version %>" disabled></input>\
</div>\
<div>\
<h4>Build Date</h4>\
<input name="date" value="<%- date %>" disabled></input>\
</div>\
<div>\
<h4>Module</h4>\
<input name="module" value="<%- module %>" disabled></input>\
</div>\
<div>\
<h4>Board</h4>\
<input name="board" value="<%- board %>" disabled></input>\
</div>\
<div>\
<h4>MAC Address</h4>\
<input name="mac" value="<%- mac %>" disabled></input>\
</div>\
<div>\
<h4>Hardware UUID</h4>\
<input name="uuid" value="<%- uuid %>" disabled></input>\
</div>\
<div>\
<h4>Memory Usage</h4>\
</div>\
<div class="col-33">\
<h5>Heap</h5>\
<input name="memory" value="<%- memory %>%" disabled></input>\
</div>\
<div class="col-33">\
<h5>Network Tx</h5>\
<input name="tx" value="<%- tx %>%" disabled></input>\
</div>\
<div class="col-33">\
<h5>Network Rx</h5>\
<input name="rx" value="<%- rx %>%" disabled></input>\
</div>\
<div>\
<h4>Uptime</h4>\
<input name="uptime" value="<%- uptime %>" disabled></input>\
</div>\
<div>\
<h4>System Time</h4>\
<input name="time" value="<%- utc %>" disabled></input>\
</div>\
<div class="clear"></div>\
<hr>\
</div>\
<div class="content">\
<h1>Webapp</h1>\
<h4>Version</h4>\
<input name="version" value="<%- webapp.version %>" disabled></input>\
<h4>Build Date</h4>\
<input name="version" value="<%= webapp.date %>" disabled></input>\
<button class="btn btn-lg active upgrade">Update</button>\
</div>'),

  initialize: function(opts){
    _.bindAll(this, 'render', 'onClose', 'formatUptime', 'update', 'onUpgrade');
    this.delegateEvents();

    this.controller = opts.controller;
    this.device = opts.device;

    this.listenTo(this.controller, 'change:view', this.render);
    this.render();
  },

  onClose: function(){
    this.stopListening();
  },

  events: {
    'click .upgrade': 'onUpgrade'
  },

  formatUptime: function(uptime) {

    var padLeft = function(str, n, pad) {
      return new Array(n - String(str).length + 1).join(pad || '0') + str;
    };

    uptime = uptime.replace('\r\n','');
    uptime = parseInt(uptime / 86400) + ' days, ' + padLeft(parseInt((uptime % 86400) / 3600), 2) + ':' + padLeft(parseInt((uptime % 3600)/60), 2) + ':' + padLeft(parseInt(uptime % 60), 2);
    return uptime;
  },

  update: function() {
    var self = this;

    var cmds = [
        {property: 'memory', cmd: 'get', args: {args: 'sy o'}, ret: false},
        {property: 'network_buffer', cmd: 'get', args: {args: 'ne b u'}, ret: false},
        {property: 'uptime', cmd: 'get', args: {args: 'ti u'}, ret: false},
        {property: 'utc', cmd: 'get', args: {args: 'time.rtc utc'}, ret: false}
      ];

    async.eachSeries(
      cmds,
      self.device.issueCommand,
      function(err, res) {

        $(self.el).find('input[name="time"]').val(self.device.get('utc').replace('\r\n',''));
        $(self.el).find('input[name="memory"]').val(self.device.get('memory') + '%');
        $(self.el).find('input[name="rx"]').val(Number(self.device.get('network_buffer').replace('\r\n','').split(',')[0].split(':')[1]) + '%');
        $(self.el).find('input[name="tx"]').val(Number(self.device.get('network_buffer').replace('\r\n','').split(',')[1].split(':')[1]) + '%');
        $(self.el).find('input[name="uptime"]').val(self.formatUptime(self.device.get('uptime')));

        self.poll = setTimeout(self.update, 1000);
      });
  },

  onUpgrade: function() {
    var self = this;

    self.controller.modal({
      systemModal: true,
      content: '<h2>Updating Webapp...</h2><div class="progress-bar"><div class="progress"></div></div>'
    });

    var files = [
      'index.html',
      'wiconnect.js.gz',
      'wiconnect.css.gz',
      'unauthorized.html'
    ];

    var filesComplete = 0;

    async.eachSeries(
      files,
      function(file, next) {
        self.device.wiconnect.http_download(
          {args: 'http://resources.ack.me/webapp/2.1/latest/' + file + ' webapp/' + file},
          function(err, res) {
            filesComplete += 1;
            $('.progress').css({width: String((filesComplete / files.length)*100) + '%'});
            next();
          });
      },
      function(err, res) {
        setTimeout(function(){top.location = top.location;}, 3000);
      });
  },

  render: function(){
    var self = this;

    if(this.controller.get('view') !== 'system'){
      $(this.el).removeClass('active');
      clearTimeout(self.poll);
      return;
    }

    self.controller.loading(true);

    var data = self.device.toJSON();
    data.tx = '';
    data.rx = '';
    data.webapp = _webapp;

    //draw empty
    self.$el.html(self.template(data)).addClass('active');
    self.views.push(new App.Views.Loader({
      el: $(self.el).find('.loading')
    }));


    var parseVersion = function(err, res) {
      var version = res.response.split(',')[0],
          dateModule = res.response.split(',')[1].trim().replace('Built:','').split(' for '),
          board = res.response.split(',')[2];

      self.device.set({
        version: version,
        date: dateModule[0],
        module: dateModule[1],
        board: board.trim().replace('Board:', '')
      });

      var cmds = [
          {property: 'mac', cmd: 'get', args: {args: 'wl m'}, ret: true},
          {property: 'memory', cmd: 'get', args: {args: 'sy o'}, ret: false},
          {property: 'network_buffer', cmd: 'get', args: {args: 'ne b u'}, ret: false},
          {property: 'uptime', cmd: 'get', args: {args: 'ti u'}, ret: false},
          {property: 'uuid', cmd: 'get', args: {args: 'sy u'}, ret: true},
          {property: 'utc', cmd: 'get', args: {args: 'time.rtc utc'}, ret: false}
        ];

        async.eachSeries(
          cmds,
          self.device.issueCommand,
          function() {
            self.controller.loading(false);

            //check still active view
            if(self.controller.get('view') !== 'system'){
              $(self.el).removeClass('active');
              return;
            }

            data = self.device.toJSON();
            data.uptime = self.formatUptime(data.uptime);
            data.tx = self.device.get('network_buffer').replace('\r\n','').split(',')[1].split(':')[1];
            data.rx = self.device.get('network_buffer').replace('\r\n','').split(',')[0].split(':')[1];
            data.webapp = _webapp;
            data.webapp.date = new Date(data.webapp.date);

            self.$el.html(self.template(data));
            self.update();
          });
    };

    self.device.wiconnect.ver(parseVersion);
  }
});
