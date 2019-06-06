// TODO
// Add search capabilities
// Add toggle button to view last year vs. comprehensive data

'use strict'

var myApp = angular.module('myApp', []);

myApp.controller('finsightController', ['$scope', function($scope) {
        var myChart,
            input,
            config = {};
        
        // Variables
        $scope.desiredFunction = 'TIME_SERIES_DAILY';
        $scope.searchResults = [];
        $scope.showSearchResults = true;
        $scope.chartType = 'line'; // line or candlestick

        // Function
        $scope.startTour = startTour;
        $scope.updateSymbol = updateSymbol;
        $scope.updateTime = updateTime;
        $scope.searchName = searchName;
        $scope.searchFromResults = searchFromResults;

        /**
         * Start the product tour
         */
        function startTour() {
            introJs().setOptions({
                "exitOnOverlayClick": true,
                "showProgress": false,
                "showBullets": true,
                "showStepNumbers": false,
                "scrollPadding": 0,
                "scrollToElement": false
            }).start();

            // introJs().addHints();

            // Save to localStorage
            localStorage.setItem('tour', true)

        }

        /**
         * Set initial stock variables.
         */
        function getData() {
            var stockSymbol,
                previusSearch;
        
            // get stock symbol from local storage if it exists
            previusSearch = localStorage.getItem('symbol');
            $scope.userSymbol = previusSearch || 'FB';
        
            searchSymbol();
        }

        /**
         * Parse through stock data using response from Aplha Vantage API.
         * @param {object} data data returned from Alpha Vantage API
         */
        function formatData(data) {
            var returnObj = {},
                dataSet,
                timeSeries = [],
                values = [],
                volume = [],
                timeKey = 'Time Series (Daily)',
                time;

            if ($scope.desiredFunction === 'TIME_SERIES_WEEKLY') {
                timeKey = 'Weekly Time Series';
            } else if ($scope.desiredFunction === 'TIME_SERIES_MONTHLY') {
                timeKey = 'Monthly Time Series';
            }
            
            for (time in data[timeKey]) {
                if (data[timeKey].hasOwnProperty(time)) {
                    timeSeries.push(time);
                    volume.push(data[timeKey][time]['5. volume']);
                    dataSet = [];
                    if ($scope.chartType === 'line') {
                        values.push(data[timeKey][time]['4. close']);
                    } else {
                        dataSet.push(data[timeKey][time]['1. open']);
                        dataSet.push(data[timeKey][time]['4. close']);
                        dataSet.push(data[timeKey][time]['3. low']);
                        dataSet.push(data[timeKey][time]['2. high']);
                        values.push(dataSet)
                    }
                }
            }
        
            config.timeSeries = timeSeries.reverse();
            config.values = values.reverse();
            config.volume = volume.reverse();
            if (data.hasOwnProperty('Meta Data')) {
                config.lastRefresh = data['Meta Data']['3. Last Refreshed'];
                config.stockSymbol = data['Meta Data']['2. Symbol'];
            }
            config.MA5 = calculateMA(5);
        
            paint();
        }
        
        /**
         * Paint the candle stick visualization.
         */
        function paint() {
            // TODO 
            // max and min lines
            var option = {
                title: {
                    text: config.stockSymbol.toUpperCase(),
                    subtext: 'Last Refreshed on ' + config.lastRefresh,
                    left: 'center',
                    top: '85px',
                    textStyle: { color: '#fff' }
                },
                legend: {
                    left: '5%',
                    top: '60px',
                    data: [{ 
                        name: 'K',
                     }, {
                         name: 'MA5'
                    }, {
                         name: 'Volume'
                     }],
                    textStyle: { color: '#fff' },
                    selected: {
                        'K': true,
                        'MA5': false,
                        'Volume': true
                    }
                },
                xAxis: [
                    {
                        type: 'category',
                        data: config.timeSeries,
                        axisLine: { lineStyle: { color: '#fff' } },
                        axisLabel: {
                            formatter: function (value) {
                                return echarts.format.formatTime('MM-dd', value);
                            }
                        }
                    },
                    {
                        type: 'category',
                        data: config.timeSeries,
                        gridIndex: 1,
                        axisLine: { lineStyle: { color: '#fff' } },
                        splitLine: {show: false},
                        axisLabel: {show: false},
                        axisTick: {show: false}
                    }
                ],
                yAxis: [
                    {
                        scale: true,
                        axisLine: { lineStyle: { color: '#fff' } },
                        splitLine: { show: false }
                    },
                    {
                        scale: true,
                        gridIndex: 1,
                        axisLabel: {show: false},
                        axisLine: {show: false},
                        axisTick: {show: false},
                        splitLine: {show: false}
                    }
                ],
                grid: [
                    {
                        left: '10%',
                        right: '10%',
                        top: '145px',
                        height: '60%'
                    },
                    {
                        left: '10%',
                        right: '10%',
                        bottom: '10%',
                        top: '81%'
                    }
                ],
                backgroundColor: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    {
                        offset: 0,
                        color: '#131315'
                    },
                    {
                        offset: 1,
                        color: '#212033'
                    }
                ], false),
                tooltip: {
                    trigger: 'axis',
                    formatter: function (param) {
                        var dateString = '',
                            averageString = '',
                            volumeString = '',
                            dateMarker,
                            dateValue,
                            openValue,
                            closedValue,
                            lowValue,
                            highValue,
                            averageMarker,
                            averageValue,
                            volumeMarker,
                            volumeValue,
                            i;
        
                        for(i = 0; i < param.length; i++) {
                            if (param[i].seriesName === 'Volume') {
                                volumeMarker = param[i].marker;
                                volumeValue = Number(param[i].value);
                                volumeString += volumeMarker +' Volume: ' + volumeValue.toLocaleString(undefined, {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                  }) + '<br>';
                            } else if (param[i].seriesName === 'K') {
                                dateMarker = param[i].marker;
                                if ($scope.chartType === 'line') {
                                    dateValue = param[i].axisValue;
                                    closedValue = Number(param[i].data);
                                    dateString += dateMarker + dateValue + '<br>' 
                                        + '  Closed: <b>' + closedValue.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        }) + '</b><br>';
                                } else {
                                    if (typeof param[i].value === 'object') {
                                        dateValue = param[i].axisValue;
                                    } else {
                                        dateValue = param[i].value;
            
                                    }
                                    openValue = Number(param[i].data[1]);
                                    closedValue = Number(param[i].data[2]);
                                    lowValue = Number(param[i].data[3]);
                                    highValue = Number(param[i].data[4]);
                                    dateString += dateMarker + dateValue + '<br>' 
                                        + '  Open: ' + openValue.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                          }) + '<br>' 
                                        + '  Closed: ' + closedValue.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                          }) + '<br>' 
                                        + '  Low: ' + lowValue.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                          }) + '<br>' 
                                        + '  High: ' + highValue.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                          }) + '<br>';
                                }       
                            } else if (param[i].seriesName === 'MA5') {
                                averageMarker = param[i].marker;
                                averageValue = Number(param[i].value);
                                averageString +=  averageMarker + ' MA5: ' + averageValue.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                  }) + '<br>';
                            }
                        
                        }
        
                        return dateString + averageString + volumeString;
                    }
                },
                axisPointer: {
                    link: [{
                        xAxisIndex: [0, 1]
                    }],
                    lineStyle: {
                        color: '#376df4',
                        width: 2,
                        opacity: 0.4
                    }
                },
                dataZoom: [{
                    textStyle: {
                        color: '#fff'
                    },
                    xAxisIndex: [0, 1],
                    handleIcon: 'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
                    handleSize: '80%',
                    dataBackground: {
                        areaStyle: {
                            color: '#fff'
                        },
                        lineStyle: {
                            opacity: 0.8,
                            color: '#fff'
                        }
                    },
                    start: 60,
                    end: 100,
                    handleStyle: {
                        color: '#fff',
                        shadowBlur: 3,
                        shadowColor: 'rgba(0, 0, 0, 0.6)',
                        shadowOffsetX: 2,
                        shadowOffsetY: 2
                    },
                    bottom: '3%',
                    height: '4%'
                }, {
                    type: 'inside',
                    xAxisIndex: [0, 1]
                }],
                series: [
                    {
                        name: 'K',
                        type: $scope.chartType,
                        data: config.values,
                        itemStyle: {
                            normal: {
                                color: '#0CF49B',
                                color0: '#FD1050',
                                borderColor: '#0CF49B',
                                borderColor0: '#FD1050'
                            }
                        },
                        axisPointer: {
                            type: 'cross',
                        }
                    },
                    {
                        name: 'MA5',
                        type: 'line',
                        data: config.MA5,
                        smooth: true,
                        showSymbol: false,
                        lineStyle: {
                            normal: {
                                width: 1.5,
                                color: '#fff',
                                type: 'dashed'
                            }
                        }
                    },
                    {
                        name: 'Volume',
                        type: 'bar',
                        xAxisIndex: 1,
                        yAxisIndex: 1,
                        itemStyle: {
                            normal: {
                                color: '#51A7F9'
                            }
                        },
                        data: config.volume,
                        axisPointer: {
                            type: 'shadow'
                        }
                    }
                ]
            };

            // Line specific styling
            if ($scope.chartType === 'line') {
                option.series[0].smooth = true;
                option.series[0].showSymbol = false;
                option.series[0].lineStyle = { // use areaaStyle also?
                    normal: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                                offset: 0,
                                color: '#0CF49B'
                            },
                            {
                                offset: 1,
                                color: '#FD1050'
                            }
                        ], false),
                    }
                };
            }


            myChart.setOption(option);
            
            // handle click event
            myChart.on('click', function (params) {
                var url, searchTerm, date;
                if (params.data.length > 0) {
                    date = params.name;
                    url = 'https://www.google.com/search?';
                    url += 'q=' + config.stockSymbol + '+stock+' + date + '&';
                    url += 'tbm=nws' 
                    window.open(url, '_blank');
        
                }
            });
        }

        /**
         * Calculate the moving average from the stock data.
         * @param {number} dayCount number of days for the moving average
         * @return {number} The result of the moving average
         */
        function calculateMA(dayCount) {
            var result = [];
            for (var i = 0, len = config.values.length; i < len; i++) {
                if (i < dayCount) {
                    result.push('-');
                    continue;
                }
                var sum = 0;
                for (var j = 0; j < dayCount; j++) {
                    if ($scope.chartType === 'line') {
                        sum += Number(config.values[i - j]);
                    } else {
                        sum += Number(config.values[i - j][1]);
                    }
                }
                result.push((sum / dayCount).toFixed(2));
            }
            return result;
        }
        
        /**
         * Update the stock symbol based on the user's input.
         */
        function updateSymbol() {
            if (!$scope.userSymbol) {
                return;
            }

            // Save to localStorage
            localStorage.setItem('symbol', $scope.userSymbol)

            searchSymbol();        
        }

        /**
         * Search for stock data using the Alpha Vantage API.
         */
        function searchSymbol() {
            var apiKey = '449P5UNKD4LX1UO9',
            outputSize = 'compact', // full or compact
            url = '';

            url += 'https://www.alphavantage.co/query?function=' + $scope.desiredFunction;
            url += '&symbol=' + $scope.userSymbol; 

            // TODO if daily by default set output size to 'full'
            if ($scope.desiredFunction === 'TIME_SERIES_DAILY') {
                url += '&outputsize=' + outputSize; 
            }
            url += '&apikey=' + apiKey;

            // $.getJSON(url, function(data) {
            //     if (data.hasOwnProperty('Error Message') || data.hasOwnProperty('Note')) {
            //         return;
            //     }
            //     // TODO only update $scope.desiredFunction if data comes back succesfully
            //     formatData(data)
            // });

            $.ajax({
                type: 'GET',
                url: url,
                async: false,
                contentType: "application/json",
                dataType: 'json',
                success: function (data) {
                    if (data.hasOwnProperty('Error Message') || data.hasOwnProperty('Note')) {
                        return;
                    }
                    // TODO only update $scope.desiredFunction if data comes back succesfully
                    formatData(data)
                },
                error: function (e) {
                    alert("error");
                }
            });
        }

        /**
         * Update chart with new symbol selected from search results
         * @param {object} result selected search result
         */
        function searchFromResults(result) {
            if (result.hasOwnProperty('1. symbol')) {
                $scope.userSymbol = result['1. symbol']
                searchSymbol();
            }
        }

        /**
         * Update the time interval to show.
         * @param {string} interval The time interval/range specified by the user
         */
        function updateTime(interval) {
            switch (interval) {
                case 'Daily':
                    $scope.desiredFunction = 'TIME_SERIES_DAILY';
                    break;
                case 'Weekly':
                    $scope.desiredFunction = 'TIME_SERIES_WEEKLY';
                    break;
                case 'Monthly':
                    $scope.desiredFunction = 'TIME_SERIES_MONTHLY';
                    break;
                default:
                    $scope.desiredFunction = 'TIME_SERIES_DAILY';
            }
            searchSymbol();
        }

        /**
         * Search for valid stocks
         */
        function searchName() {
            // TODO add 0.25 sec timeout before hitting url

            var apiKey = '449P5UNKD4LX1UO9',
                url = '';

            $scope.searchResults = [];

            url += 'https://www.alphavantage.co/query?function=SYMBOL_SEARCH';
            url += '&keywords=' + $scope.userSymbol; 

            url += '&apikey=' + apiKey;

            // $.getJSON(url, function(data) {
            //     var i;
            //     if (data.hasOwnProperty('bestMatches')) {
            //         $scope.searchResults = data.bestMatches;
            //         console.log($scope.searchResults);
            //     }
            // });

            $.ajax({
                type: 'GET',
                url: url,
                async: false,
                contentType: "application/json",
                dataType: 'json',
                success: function (data) {
                    var i;
                    if (data.hasOwnProperty('bestMatches')) {
                        $scope.searchResults = data.bestMatches;
                        console.log($scope.searchResults);
                    }
                },
                error: function (e) {
                    alert("error");
                }
            });
        }
        
        /**
         * Initial Function
         */
        function initialize() {
            $(document).ready(function(){
                $('.searchBar').focus(function(){
                    $('.search-results').fadeIn(250);
                    $('.search-results-arrow').fadeIn(250);
                }).focusout(function(){
                    $('.search-results').fadeOut(250);
                    $('.search-results-arrow').fadeOut(250);
                });
             });

            var productTour = localStorage.getItem('tour');

            // Start product tour if first time for user
            if (!productTour) {
                startTour();
            }
            myChart = echarts.init(document.getElementById('chart'));
            getData();
        }

        // Listeners
        window.addEventListener('resize', function() {
            if (myChart) {
                myChart.resize();
            }
        });

        input = document.getElementById("user-input");
        input.addEventListener("keyup", function(event) {
        event.preventDefault();
        if (event.keyCode === 13) {
            document.getElementById("symbol-button").click();
        }
        });
    
        initialize();
}]);