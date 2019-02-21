'use strict';

    class SelectMenu {

        constructor(element, render = true) {
            if (typeof element === 'string') {
                element = $(element)
            }
            if (typeof element === 'object') {
                this.element = element
            }

            this.id = element.prop('id');
            this.ids = {};
            this.defautlValue = null;

            this._rendered = false;

            if (render) this.render();
        }
        _drawWrap() {
            this.ids.wrap = this.id + '-wrap';
            this.wrap = $('<div>', {
                id: this.ids.wrap,
            }).insertAfter(this.element);

            this.wrap.addClass('tt-select-menu-wrap');
        }
        _drawInput() {
            let item = this.element.find( "option:selected" );

            this.ids.input = this.id + '-input';
            this.element.parent().find('label').prop('for', this.ids.input);

            this.element.hide();

            this.input = $('<input>', {
                id: this.ids.button,
                readOnly: true
            }).appendTo(this.wrap);
            this.input.addClass('tt-select-menu-input');

            this.arrowBottom = $('<span>').appendTo(this.wrap);
            this.arrowBottom.addClass('tt-select-menu-arrow-bottom');

            this.select(item.val(), item.text());
            this.defautlValue = item.val();

            this._on(this.input, 'click', this.toggle);
            //this._on(this.arrowBottom, 'click', this.toggle);
            this._on(this.wrap, 'blur', this.close);
        }
        _drawMenu() {
            this.ids.menu = this.id + '-menu';
            this.menuWrap = $('<div>').appendTo(this.wrap);

            this.menuWrap.addClass('tt-select-menu-items-wrap');
            this.menuWrap.hide();

            this.menu = this.menu = $('<ul>', {
                id: this.ids.menu
            }).appendTo(this.menuWrap);

            this.menu.addClass('tt-select-menu-items');

            this._renderItems();
        }
        _renderItems() {
            let items = this.element.find('option'),
                that = this;

            items.each((k, v) => {
                let li = $('<li>', {
                    value: v.value,
                    text: v.text
                }).appendTo(this.menu);

                li.addClass('tt-select-menu-item');

                li.on('click', () => {
                    that.select(v.value, v.text);
                });
            });
        }
        _on(element, event, handler) {
            let that = this;
            element.on(event, (event) => {
                handler.apply(that);
            });
        }
        render() {
            this._drawWrap();
            this._drawInput();
            this._drawMenu();

            this._rendered = true;
        }
        select(value, text) {
            this.input.val(text);
            this.element.val(value);
            this.close();
        }
        open() {
            if (!this._rendered) return false;
            this.menuWrap.show();
        }
        close() {
            if (!this._rendered) return false;
            this.menuWrap.hide();
        }
        toggle() {
            if (!this._rendered) return false;
            this.menuWrap.toggle()
        }
        val(value) {
            if (value !== undefined) {
                this.element.val(value);
            }

            return this.element.val();
        }
        set(value) {
            let li = this.menu.find('li[value='+value+']');
            if (li.length) {
                this.select(li.val(), li.text());
            }
            else {
                this.reset();
            }
        }
        get() {
            return this.val();
        }
        reset() {
            this.set(this.defautlValue);
        }
    }

    class ComboBox extends SelectMenu {
        static escapeRegex(value) {
            return value.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
        }

        constructor(element, options = {}, render = true) {
            super(element, false);

            this.options = options;
            this.source = this.store = null;
            this.limit = this.options.limit || 10;
            this.minLength = this.options.minLength || 3;


            if (render) this.render();
        }
        _createSource() {
            if ($.isArray(this.options.source)) {
                let source = this.options.source.sort(),
                    that = this;

                this.source = (value = '') => {
                    that._search(value);
                };
                this._source = source;
                this.source();
            }
        }
        _search(value) {
            this.store = this._filter(this._source, value, false);
            this.refreshMenu()
        }
        _filter(source, value) {
            let matcher = new RegExp(ComboBox.escapeRegex(value), 'i');
            return $.grep(source, function(value) {
                return matcher.test(value.label || value.value || value);
            });
        }
        _searchKeys(key) {
            let value = null;
            $.each(this._source, (k, v) => {
                if (k == key) {
                    value = v;
                    return false;
                }
            });

            return value;

        }
        _renderItems(offset = 0) {
            let items = [].slice.call(this.store, offset),
                that = this,
                limit = 0;

            this.ids.itemMore = this.id + '-menu-item-more';
            $('#'+this.ids.itemMore).remove();

            $.each(items, (k, v) => {
                let li = $('<li>', {
                    value: k,
                    text: v
                }).appendTo(this.menu);

                li.addClass('tt-select-menu-item');

                li.on('click', () => {
                    that.select(k, v);
                    this.validateInput();
                });

                limit++;
                if (limit >= this.limit) {
                    return false
                }
            });

            if (items.length > this.limit) {
                let li = $('<li>', {
                    id: this.ids.itemMore,
                    text: '...'
                }).appendTo(this.menu);

                li.addClass('tt-select-menu-item');

                li.on('click', () => {
                    that._renderItems(offset + this.limit);
                });
            }
            if (items.length) this.open();
        }
        _renderInput() {
            this.input.prop('readOnly', false);
            this._on(this.input, 'input', () => {
                let text = this.input.val();
                this.val(null);
                if (!text.length) text = '';
                else if (text.length < this.minLength) return false;

                this.source(text);
            });
            this._on(this.input, 'change', this.validateInput);
        }
        render() {
            this._createSource();
            this._drawWrap();
            this._drawInput();
            this._drawMenu();
            this._renderInput();
            this._rendered = true;
        }
        refreshMenu() {
            if (!this._rendered) return false;
            this.menuWrap.hide();
            this.menu.empty();
            this._renderItems();
        }
        validateInput() {
            if (this.get() === "") {
                this.input.addClass('tt-select-menu-input-invalid');
            }
            else {
                this.input.removeClass('tt-select-menu-input-invalid');
            }
        }
        open() {
            if (!this._rendered || !this.store.length) return false;
            this.menuWrap.show();
        }
        close() {
            if (!this._rendered) return false;
            this.menuWrap.hide();

        }
        toggle() {
            if (!this._rendered || !this.store.length) return false;
            this.menuWrap.toggle()
        }
        set(key) {
            let value = this._searchKeys(key);

            this.input.val(value);
            this.element.val(key);
        }
    }
