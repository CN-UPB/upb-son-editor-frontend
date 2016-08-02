var serverURL = "http://jonas-msi:5000/";
var vnfs= [];
var services=[];

$(document).ready(function () {
	var wsId=$.cookie("wsId");
	var ptId=$.cookie("ptId");
	$.getJSON(serverURL + "workspaces/"+wsId+"/"+ptId+"/services/", function (data) {
		services= data.services;
		for (i = 0; i < services.length; i++) {
			var serviceName = services[i].name;
			var serviceId = services[i].id;
			(function (serviceName serviceId) {
				var tdType=document.createElement("td");
				tdType.innerHTML="Service";
				var tdName=document.createElement("td");
				tdName.innerHTML=serviceName ;
				var trService document.createElement("tr");
				trService.append(tdType);
				trService.append(tdName);
				$(" # display_NS_VNFS ").append(trSerivce);
				trService.addEventListener('click', function () {
					loadService(serviceName, serviceId);
				}, false);
			})(serviceName,serviceID)
		}
	}
	$.getJSON(serverURL + "workspaces/"+wsId+"/"+ptId+"/functions/", function (data) {
		vnfs= data.vnfs;
		for (i = 0; i < vnfs.length; i++) {
			var vnfName = vnfs[i].name;
			var vnfId = vnfs[i].id;
			(function (vnfName vnfId) {
				var tdType=document.createElement("td");
				tdType.innerHTML="VNF";
				var tdName=document.createElement("td");
				tdName.innerHTML=vnfName ;
				var trvnf document.createElement("tr");
				trVnf.append(tdType);
				trVnf.append(tdName);
				$(" # display_NS_VNFS ").append(trSerivce);
				trvnf.addEventListener('click', function () {
					loadVnf(vnfName, vnfId);
				}, false);
			})(vnfName,vnfID)
		}
	}
});

function loadService(serviceName, serviceId)
{
	window.location.href="nsView.html";
}

function loadVnf(vnfName, vnfId)
{
	window.location.href="vnfView.html";
}