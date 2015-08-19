'use strict';

(function() {

    var App = {
        // Marionette Application
        Marionette: new Backbone.Marionette.Application(),

        // Collections, Models, and Views namespace
        Collections: {},
        Models: {},
        Views: {},
    }

    // Task model
    App.Models.Task = Backbone.Model.extend({
        defaults: {
            title: '',
            priority: 2,
            isComplete: false,
            isChecked: false,
            isEditing: false,
        },
    });

    // Task collection
    App.Collections.Tasks = Backbone.Collection.extend({
        model: App.Models.Task,
    });

    // Form view
    App.Views.Form = Backbone.Marionette.ItemView.extend({
        template: '#form-view',
        events: {
            'submit form': 'onCreateItem',
        },
        ui: {
            $title: '#title',
            $priority: '#priority'
        },
        onCreateItem: function(e) {
            e.preventDefault();

            var newTask = new App.Models.Task({
                title: this.ui.$title.val(),
                priority: this.ui.$priority.val(),
            });

            this.ui.$title.val('');
            this.ui.$priority.val(2);
            this.collection.add(newTask);
        },
    });

    // Task view
    App.Views.Task = Backbone.Marionette.ItemView.extend({
        template: '#task-view',
        tagName: 'tr',
        events: {
            'click .onEdit': 'onEdit',
            'click .onDestroy': 'onDestroy',
            'click .onSave': 'onSave',
            'keypress input[name="title"]': function(e) { if (e.keyCode == 13) this.onSave() },
            'change input[type="checkbox"]': 'onToggleIsChecked',
        },
        modelEvents: {
            'destroy': 'onRemove',
            'change:isEditing': 'onEditingChanged',
            'change:isChecked': 'onCheckedChanged',
            'change:isComplete': 'onStatusChanged',
        },
        templateHelpers: function () {
            return {
                index: App.Marionette.tasks.indexOf(this.model),
                statusName: function() {
                    return this.isComplete
                        ? 'Complete'
                        : 'Incomplete';
                },
            };
        },
        onSave: function() {
            this.model.set('title', $.trim(this.$('input[name="title"]').val()));
            this.model.set('priority', this.$('select[name="priority"]').val());
            this.model.set('isEditing', false);
        },
        onCheckedChanged: function() {
            this.$('input[type="checkbox"]').prop('checked', this.model.get('isChecked'));
        },
        onEditingChanged: function() {
            this.render();
        },
        onStatusChanged: function() {
            this.render();
        },
        onEdit: function() {
            console.log ('hello');
            this.model.set('isEditing', !this.model.get('isEditing'));
        },
        onDestroy: function() {
            this.model.destroy();
        },
        onRemove: function() {
            this.$el.remove();
        },
        onToggleIsChecked: function() {
            this.model.set('isChecked', this.$('input[type="checkbox"]').first().is(':checked'));
        },
    });

    // Tasks empty view
    App.Views.TasksEmpty = Backbone.Marionette.ItemView.extend({
        template: '#tasks-empty-view',
        tagName: 'p',
    });

    // Collection view
    App.Views.Tasks = Backbone.Marionette.CompositeView.extend({
        template: '#tasks-table-view',
        childView: App.Views.Task,
        childViewContainer: 'tbody',
        getTemplate: function() {
            return this.collection.length === 0
                ? '#tasks-empty-view'
                : '#tasks-table-view';
        },
        events: {
            'submit form': 'onSubmit',
            'click a.sort': 'onSortTasks',
            'change .select-all': 'onSelectAll',
            'click .onDelete': function() { this.updateSelected(function(task) { task.destroy() }) },
            'click .onComplete': function() { this.updateSelected(function(task) { task.set('isComplete', true) }) },
            'click .onIncomplete': function() { this.updateSelected(function(task) { task.set('isComplete', false) }) },
        },
        ui: {
            $form: '#table-form'
        },
        onSubmit: function(e) {
            e.preventDefault();
        },
        onSelectAll: function() {
            var self = this;
            this.collection.each(function(task) {
                task.set('isChecked', self.$('.select-all').prop('checked'));
            });
        },
        updateSelected: function(action) {
            // Todo: find a better way to do this...
            // Currently itterating over the array backwards so deleted index don't
            // change the position of other models that should also be deleted.v
            for (var i = this.collection.length - 1; i >= 0; --i) {
                var task = this.collection.at(i);
                if (typeof task !== 'undefined' && task.get('isChecked')) {
                    task.set('isChecked', false);
                    action(task);
                }
            }
        },
    });

    // Register the form and list regions
    App.Marionette.addRegions({
        form: '#form-region',
        table: '#table-region',
    });

    // Initialize the collection and views
    App.Marionette.addInitializer(function() {

        // Seed some dummy data
        App.Marionette.tasks = new App.Collections.Tasks([
            { title: 'Wake up', priority: 1, isComplete: true },
            { title: 'Go to the store', priority: 2 },
            { title: 'Pick up the dry cleaning', priority: 3 },
            { title: 'Learn Backbone', priority: 4 },
            { title: 'Learn Marionette', priority: 5 },
        ]);

        // Display our regions
        App.Marionette.form.show( new App.Views.Form({ collection: App.Marionette.tasks }));
        App.Marionette.table.show( new App.Views.Tasks({ collection: App.Marionette.tasks }));
    });

    // Ready, set, go!
    App.Marionette.start();

})();
