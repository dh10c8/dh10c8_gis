$(document).ready(function () {
  var format = "image/png";
  var bounds = [564182.125, 2317466.0, 564514.4375, 2318014.0];
  var vung = new ol.layer.Image({
    source: new ol.source.ImageWMS({
      ratio: 1,
      url: "http://localhost:8080/geoserver/dh10c8/wms",
      params: {
        FORMAT: format,
        VERSION: "1.1.0",
        STYLES: "",
        LAYERS: "c8_dh10:camhoangdc_1",
      },
    }),
  });
  var duong = new ol.layer.Image({
    source: new ol.source.ImageWMS({
      ratio: 1,
      url: "http://localhost:8080/geoserver/dh10c8/wms",
      params: {
        FORMAT: format,
        VERSION: "1.1.0",
        STYLES: "",
        LAYERS: "dh10c8:camhoangub_1",
      },
    }),
  });
  var diem = new ol.layer.Image({
    source: new ol.source.ImageWMS({
      ratio: 1,
      url: "http://localhost:8080/geoserver/dh10c8/wms",
      params: {
        FORMAT: format,
        VERSION: "1.1.0",
        STYLES: "",
        LAYERS: "dh10c8:camhoanggt_1",
      },
    }),
  });

  var projection = new ol.proj.Projection({
    code: "EPSG:3405",
    units: "m",
    axisOrientation: "neu",
  });
  var view = new ol.View({
    projection: projection,
  });
  var map = new ol.Map({
    target: "map",
    layers: [vung, duong, diem],
    overlay: [overlay],
    view: view,
  });
  map.getView().fit(bounds, map.getSize());

  $("#checkvung").change(function () {
    if ($("#checkvung").is(":checked")) {
      vung.setVisible(true);
    } else {
      vung.setVisible(false);
    }
  });

  $("#checkduong").change(function () {
    if ($("#checkduong").is(":checked")) {
      duong.setVisible(true);
    } else {
      duong.setVisible(false);
    }
  });

  $("#checkdiem").change(function () {
    if ($("#checkdiem").is(":checked")) {
      diem.setVisible(true);
    } else {
      diem.setVisible(false);
    }
  });

  $("#checkbg").change(function () {
    if ($("#checkbg").is(":checked")) {
      $("body").addClass("bg-dark");
    } else {
      $("body").removeClass("bg-dark");
    }
  });

  map.on("singleclick", function (evt) {
    var view = map.getView();
    var viewResolution = view.getResolution();
    var source = vung.getSource();
    var url = source.getFeatureInfoUrl(
      evt.coordinate,
      viewResolution,
      view.getProjection(),
      { INFO_FORMAT: "application/json", FEATURE_COUNT: 50 }
    );

    console.log(url);
    if (url) {
      var request = $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
      });

      request.done(function (n) {
        var content = `<table>`;
        if (n.features.length == 0) {
          overlay.setPosition(undefined);
        } else {
          for (let i = 0; i < n.features.length; i++) {
            var feature = n.features[i];
            var featureAttr = feature.properties;
            console.log(featureAttr);

            content +=
              `<tr><td><b>Loại đất:</b> ` +
              featureAttr["txtmemo"] +
              `</td></tr><tr><td><b>Diện tích:</b> ` +
              featureAttr["shape_area"] +
              `</td></tr>`;
          }
          content += `</table>`;
          console.log(content);
          $("#popup-content").html(content);
          overlay.setPosition(evt.coordinate);
          var vectorSource = new ol.source.Vector({
            features: new ol.format.GeoJSON().readFeatures(n),
          });
          vectorLayer.setSource(vectorSource);
          console.log(n);
        }
      });

      request.fail(function (jqXHR, textStatus) {
        alert("Request failed: " + textStatus);
      });
    }
  });

  var styles = {
    MultiPolygon: new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: "red",
        width: 5,
      }),
    }),
  };

  var styleFunction = function (feature) {
    return styles[feature.getGeometry().getType()];
  };

  var vectorLayer = new ol.layer.Vector({
    style: styleFunction,
  });
  map.addLayer(vectorLayer);

  // Hien thi thuoc tinh cua doi tuong
  const container = $("#popup")[0];
  // const content = document.getElementById('popup-content');
  const closer = $("#popup-closer")[0];

  var overlay = new ol.Overlay({
    element: container,
    autoPan: true,
    autoPanAnimation: {
      duration: 250,
    },
  });
  map.addOverlay(overlay);
  closer.onclick = function () {
    overlay.setPosition(undefined);
    closer.blur();
    return false;
  };

  $("#in_search").on("keyup", function () {
    var key = $(this).val();
    if(key == ''){
      $("#data-search").hide()
    }else{
      $("#data-search").show()
    }
    $.ajax({
      type: "GET",
      url: "http://localhost/dh10c8_gis/php/search.php",
      data: { ten_vung: key },
      success: function (data) {
        // console.log(data);
        $("#data-search").html("");
        $("#data-search").html(data);
        $(".data-item").click(function () {
          var x = $(this).find(".x").val();
          var y = $(this).find(".y").val();
          console.log("x=" + x + " y=" + y);
          func_teleport(x, y);
        });
      },
    });
  });

  window.addEventListener("popstate", function (e) {
    if (e.state === null) {
      return;
    }  
    var updatePermalink = function () {
      if (!shouldUpdate) {
        shouldUpdate = true;
        return;
      }

      var center = view.getCenter();
      var hash =
        "#map" +
        view.getZoom() +
        "/" +
        Math.round(center[0] * 100) / 100 +
        "/" +
        Math.round(center[1] * 100) / 100 +
        "/" +
        view.getRotation();

      var state = {
        zoom: view.getZoom(),
        center: view.getCenter(),
        rotation: view.getRotation(),
      };

      window.history.pushState(state, "map", hash);
    };
    map.on("moveend", updatePermalink);
    map.getView().setCenter(e.state.center);
    map.getView().setZoom(e.state.zoom);
    map.getView().setRotation(e.state.rotation);
    shouldUpdate = false;
  });

  function func_teleport(x, y) {
    var location = ol.proj.fromLonLat([x, y], projection);
    view.animate({
      center: location,
      duration: 2000,
      zoom: 20,
    });
    map.addLayer(vectorLayer);
  }
});

