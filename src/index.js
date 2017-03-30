import {createPlacemark, getProvider} from './map';
import model from './model';
var friendBalloon = require('../friend-balloon.hbs');

require('./map.css');
require('./friend.css');

var map;
var clusterer;

new Promise(resolve => ymaps.ready(resolve))
    .then(() => model.login(5267932, 2))
    .then(() => {
        map = new ymaps.Map('map', {
            center: [55.751574, 37.573856],
            zoom: 3
        });

        clusterer = new ymaps.Clusterer({
            /**
             * Через кластеризатор можно указать только стили кластеров,
             * стили для меток нужно назначать каждой метке отдельно.
             * @see https://api.yandex.ru/maps/doc/jsapi/2.1/ref/reference/option.presetStorage.xml
             */
            preset: 'islands#invertedVioletClusterIcons',
            /**
             * Ставим true, если хотим кластеризовать только точки с одинаковыми координатами.
             */
            groupByCoordinates: false,
            /**
             * Опции кластеров указываем в кластеризаторе с префиксом "cluster".
             * @see https://api.yandex.ru/maps/doc/jsapi/2.1/ref/reference/ClusterPlacemark.xml
             */
            clusterDisableClickZoom: true,
            clusterHideIconOnBalloonOpen: false,
            geoObjectHideIconOnBalloonOpen: false
        });

        /**
         * Можно менять опции кластеризатора после создания.
         */
        clusterer.options.set({
            gridSize: 80,
            clusterDisableClickZoom: true
        });
        map.geoObjects.add(clusterer);

        return model.getFriends(['photo_100', 'country', 'city']);
    })
    .then(friends => {
        var promises = friends.items
            .filter(friend => friend.city)
            .map(friend => {
                var search = [];

                if (friend.country && friend.country.title) {
                    search.push(friend.country.title);
                }

                search.push(friend.city.title);

                return ymaps.geocode(search.join(', '), getProvider(friend));
            });

        return Promise.all(promises);
    })
    .then(geoResponse => {
        geoResponse
            .filter(response => {
                var geoObject = response.geoObjects.get(0);

                return geoObject && geoObject.geometry;
            })
            .forEach(response => {
                var geoObject = response.geoObjects.get(0);
                var coords = geoObject.geometry.getCoordinates();
                var placemark = createPlacemark(coords, {
                    balloonContent: friendBalloon(response.friend)
                });

                clusterer.add(placemark);
            });
    });

