var render_builder={};
var DFL_COLOR = [
  "black",
  "blue",
  "green",
  "SaddleBrown",
  "Purple",
  "Lime",
  "lightcoral",
  "orange",
  "Aqua",
  "Fuchsia",
  "yellow",
  "red"
];
Chart.defaults.LineWithLine = Chart.defaults.line;
Chart.controllers.LineWithLine = Chart.controllers.line.extend({
   draw: function(ease) {
      Chart.controllers.line.prototype.draw.call(this, ease);

      if (this.chart.tooltip._active && this.chart.tooltip._active.length) {
         var activePoint = this.chart.tooltip._active[0],
             ctx = this.chart.ctx,
             x = activePoint.tooltipPosition().x,
             topY = this.chart.legend.bottom,
             bottomY = this.chart.chartArea.bottom;

         // draw line
         ctx.save();
         ctx.beginPath();
         ctx.moveTo(x, topY);
         ctx.lineTo(x, bottomY);
         ctx.lineWidth = 0.5;
         ctx.strokeStyle = '#07C';
         ctx.stroke();
         ctx.restore();
      }
   }
});

var d_color={
  "red": {
    backgroundColor: 'rgba(255, 99, 132, 0.2)',
    borderColor: 'rgba(255, 99, 132, 1)'
  },
  "blue": {
    backgroundColor: 'rgba(54, 162, 235, 0.2)',
    borderColor: 'rgba(54, 162, 235, 1)',
  },
  "green": {
    backgroundColor: "rgb(60, 255, 60, 0.2)",
    borderColor: "rgb(60, 255, 60)"
  }
}

function setGraphChart(obj, dataset) {
    if (obj.id==null) obj.id = "myChart";
    if (obj.type==null) throw "El parámetro type es obligatorio";
    var elem = (typeof obj.id == "string")?document.getElementById(obj.id):obj.id;
    if (obj.destroy) {
      var $elem = $(elem);
      var ch = $elem.data("chart");
      if (ch) {
        var hd = $elem.data("full_hidden") || {};
        ch.legend.legendItems.forEach(function(x, i){
          var lb = x.text;
          if (obj.parseLabel) lb = obj.parseLabel(lb);
          return hd[lb]=x.hidden;
        })
        dataset.forEach(function(d, i){
          var lb = d.label;
          if (obj.parseLabel) lb = obj.parseLabel(lb);
          if (hd[lb]!=null) d.hidden=hd[lb];
          hd[lb]=d.hidden;
        })
        $elem.data("full_hidden", hd);
        ch.destroy();
      }
    }
    if (obj.labels.length && typeof obj.labels[0] == "number"){
      var dc = obj.labels.reduce(function(a,b){
        return Math.max(
          a,
          Math.floor(b) == b?0:b.toString().split(".")[1].length,
        )
      }, 0);
      obj.labels = obj.labels.map(function(x) {return x.toFixed(dc);})
    }
    var ctx = elem.getContext('2d');
    var dat = {
        type: obj.type,
        data: {
            labels: obj.labels,
            datasets: dataset
        },
        options: {
            title: {
              display: obj.title!=null,
              text: obj.title,
            },
            tooltips: {
              mode: 'index',
              //mode: 'nearest',
              intersect: false
            },
            responsive: true,
            scales: {
              xAxes: [{
                stacked: true,
              }],
              yAxes: [{
                ticks: {
                    beginAtZero: true
                }
              }]
            },
            onResize: function(ch, sz)  {
              var div = $(ch.canvas).closest("div.canvas_wrapper");
              if (div.length == 0) return;
              var max_height = $("#sidebar").height() - 300;
              if (sz.height>max_height) {
                var ratio = sz.width / sz.height;
                var max_width = max_height * ratio;
                div.css("width", max_width+"px");
              }
              else div.css("width", "");
            }
        }
    };
    if (obj.tooltips) {
      dat.options.tooltips.callbacks = obj.tooltips;
    }
    if (obj.porcentaje) {
      dat.options.scales.yAxes[0].ticks.callback=function(value, index, values) {
          return value+' %';
      }
    }
    dat.data.datasets.forEach(function(i){
      if (!i.pointBackgroundColor) i.pointBackgroundColor=i.borderColor;
      if (!i.pointBorderColor) i.pointBorderColor=i.borderColor;
    });
    if (!obj.show_points) {
        if (!dat.options.hover) dat.options.hover={};
        dat.options.hover= {
          intersect: false,
          animationDuration: 0
        };
        dat.data.datasets.forEach(function(i){
          i.pointHoverRadius=3;//i.pointRadius;
          i.pointRadius = 0;
        });
    }
    if (obj.x_label) {
      dat.options.scales["xAxes"][0]. scaleLabel= {
        display: true,
        labelString: obj.x_label
      }
    }
    if (obj.y_label) {
      dat.options.scales["yAxes"][0]. scaleLabel= {
        display: true,
        labelString: obj.y_label
      }
    }
    var i;
    for (i=0; i<dataset.length && !dat.options.legend;i++) {
      if (dataset[i].label==null) dat.options.legend={display:false};
    }
    var myChart = new Chart(ctx, dat);
    if (obj.max_y && dataset.length>1) {
      if (obj.max_y==true) obj.max_y = myChart.scales["y-axis-0"].max;
      myChart.options.scales.yAxes[0].ticks.max = obj.max_y;
      myChart.update();
    }
    $(elem).data("chart", myChart);
    return myChart;
}

function gF(obj, key, porcentaje){
  values = obj["values"].map(function(x){return x[key] || 0});
  if (porcentaje!=null) {
    var total = values.reduce(function(a,b){return a + b}, 0);
    var dc=Math.pow(10, porcentaje);
    values = values.map(function(x){return Math.round((x*100/total)*dc)/dc});
  }
  return values;
}

function mesTo(ym) {
  var y=Math.floor(ym);
  var m=(ym*100)-(y*100);
  var obj={
    year:y,
    mes:m,
    trimestre: dcd(m,
      1,1,2,1,3,1,
      4,2,5,2,6,2,
      7,3,8,3,9,3,
      4
    ),
    cuatrimestre: dcd(m,
      1,1,2,1,3,1,4,1,
      5,2,6,2,7,2,8,2,
      3
    ),
    semestre: m<7?1:2
  }
  return obj;
}

function doAgrupar(tipo, keys, trim) {
  if (trim==null) trim={r:true, l:true};
  var letter = tipo[0].toUpperCase();
  var re_index={}
  var last_piece=null;
  var new_keys=[]
  keys.forEach(function(item, i) {
    var lst = new_keys.length-1;
    var dt_mes = mesTo(item);
    var m = dt_mes.mes;
    if (lst==-1 && trim.l) {
      if (letter=="T" && !(m==1 || m==4 || m==7 || m==10)) return;
      if (letter=="C" && !(m==1 || m==5 || m==9)) return;
      if (letter=="S" && !(m==1 || m==6)) return;
      if (letter=="Y" && !(m==1)) return;
    }
    var t=dt_mes.year;
    if (letter!="Y") {
      t = t + (dt_mes[tipo]/100);
    }
    if (lst>=0 && new_keys[lst]==t) {
      re_index[i]=lst;
    } else {
      new_keys.push(t);
      re_index[i]=lst+1;
    }
    if (m==6 || m==12) last_piece=new_keys.length;
    if (letter=="T" && (m==3 || m==6 || m==9 || m==12)) last_piece=new_keys.length;
    if (letter=="C" && (m==4 || m==8 || m==12)) last_piece=new_keys.length;
    if (letter=="S" && (m==6 || m==12)) last_piece=new_keys.length;
  })
  if (trim.r) {
    new_keys=new_keys.slice(0, last_piece);
  }
  if (letter!="Y") new_keys = new_keys.map(function(a) {return a.toFixed(2).replace(".0", " "+letter)})
  return {
    "keys": new_keys,
    "index": re_index
  }
}

function render_chart() {
  var t=$(this);
  var key_modelo = t.data("modelo") || t.find("*[name=modelo]").val();
  var mdl = modelos[key_modelo];
  if (mdl==null) {
    console.log(key_modelo+" no encontrado");
    return;
  }
  var rd = render_builder[key_modelo];
  if (rd==null) {
    console.log(key_modelo+" no encontrado builder");
    return;
  }
  if (typeof mdl == "function") mdl=mdl.apply(t, []);
  var tags = t.find(".tag_filter:not(.tagify)").data("mytagify");
  if (tags) {
    tags = tags.value.filter(function(x){
      return x.__isValid;
    }).map(function(x) {
      return x.value;
    });
  }
  var prc = t.find("*[name=porcentaje]").val()=="1";
  var transformacion = t.find("*[name=transformacion]").val();
  if (transformacion=="porcentaje") {
    prc = true;
    transformacion = null;
  } else {
    transformacion = toNum(transformacion, transformacion);
  }

  var agrupar = t.find("*[name=agrupar]").val();
  if (agrupar && agrupar!="mes") {
    var agr = doAgrupar(agrupar, mdl["keys"], {l:false, r:true});
    var _mdl = {
      "keys": agr.keys,
      "values": []
    }
    mdl["values"].forEach(function(v, i){
      var new_index = agr.index[i];
      if (new_index==null || new_index>=_mdl["keys"].length) return;
      var new_value = _mdl["values"][new_index];
      if (new_value==null) {
        var x = {}
        Object.assign(x, v)
        _mdl["values"].push(x);
      } else {
        Object.entries(v).forEach(([key, value]) => {
            new_value[key]=(new_value[key] || 0)+value;
        });
        _mdl["values"][new_index]=new_value;
      }
    });
    mdl=_mdl;
  }
  if (prc && t.data("porcentaje")!="0" && mdl["keys"] && mdl["values"]) {
    var _mdl = {
      "keys": mdl["keys"].slice(),
      "values": []
    }
    mdl["values"].forEach(function(v){
      var total = v["total"];
      if (total==null) total = Object.values(v).reduce(function(a,b){return a + b}, 0)
      var nv={};
      Object.entries(v).forEach(([key, value]) => {
        if (key!="total") {
          nv[key]=value*100/total;
          nv[key]=Math.round(nv[key]*100)/100;
        }
      });
      _mdl["values"].push(nv);
    });
    mdl=_mdl;
  }
  var rd = render_builder[key_modelo];
  if (rd==null) {
    console.log(key_modelo+" no encontrado builder");
    return;
  }
  rd.apply(t, [mdl, {
    "porcentaje": prc,
    "transformacion": transformacion,
    "agrupar": agrupar,
    "tags": tags,
    "jq": t
  }]);
}

$(document).ready(function(){
  $("div.data")
  .on("render", render_chart)
  .find("select,input").change(function(){
    $(this).closest("div.data").trigger("render");
  });
  $("div.data").trigger("render");
})
