import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import cities from "../data/cities_with_outlets.json";
import categories from "../data/parsed_categories.json";

const ENDPOINT =
  "https://saaq.gouv.qc.ca/en/find-service-outlet?tx_lbopointsdeservice_eid%5Baction%5D=getPointsDeService&tx_lbopointsdeservice_eid%5Bcontroller%5D=EId&type=1600174700&cHash=079b65ba53fd59edb59cbc7931f9b55f";

const log = (data) => {
  const file = fs.readFileSync(path.resolve("./src/data/logs.json"));

  const logs = JSON.parse(file.toString());

  logs.push(data);

  fs.writeFileSync(path.resolve("./src/data/logs.json"), JSON.stringify(logs));
};

const findOutlets = async () => {
  let count = 0;

  for (const category of categories) {
    const services = category.services;

    if (services.length < 1) {
      for (const city of Object.values(cities)) {
        const outlets: any[] = [];

        count++;
        console.log(count);

        try {
          const response = await axios({
            method: "post",
            url: ENDPOINT,
            data: {
              tx_lbopointsdeservice_eid: {
                ville: city.uid,
                sujet: category.uid,
              },
            },
            headers: { "Content-Type": "multipart/form-data" },
          });

          if (response.data.markers.length < 1) {
            continue;
          }

          for (const index in response.data.markers) {
            response.data.markers[index].city_uid = city.uid;
          }

          for (let i = 0; i < response.data.markers.length; i++) {
            const render_1 = response.data.render.split(`id="pointDeService-${response.data.markers[i].letter}"`)[1];

            const render_2 = render_1.split('id="pointDeService-')[0];

            const render = render_2 || render_1;

            if (render.includes("<strong>without any appointments") || render.includes("<strong>without appointment")) {
              response.data.markers[i].service_point = "WITHOUT_APPOINTMENT";
              continue;
            }

            if (render.includes("The offices of this service outlet are closed for an indefinite period.")) {
              response.data.markers[i].service_point = "INDEFINITLY_CLOSED";
              continue;
            }

            if (render.includes("The offices of this service outlet are closed until")) {
              response.data.markers[i].service_point = "CLOSED_UNTIL";
              continue;
            }

            if (render.includes("To avoid waiting in line, you can make an appointment at")) {
              response.data.markers[i].service_point = "APPPOINTMENT_BY_PHONE";
              continue;
            }

            if (render.includes("https://outlook.office365.com/owa/calendar/")) {
              response.data.markers[i].service_point = render
                .split("https://outlook.office365.com/owa/calendar/")[1]
                .split("@")[0];
              continue;
            }

            const service_point = render.split("https://saaq.gouv.qc.ca/prise-de-rendez-vous/?point-de-service=");

            response.data.markers[i].service_point = service_point[1].split('"')[0];
          }

          outlets.push(...response.data.markers);

          const file = fs.readFileSync(path.resolve("./src/data/outlets_by_category.json"));

          const outlets_by_category = JSON.parse(file.toString());

          outlets_by_category[category.uid] = outlets_by_category[category.uid]
            ? [...outlets_by_category[category.uid], ...outlets]
            : outlets;

          fs.writeFileSync(
            path.resolve("./src/data/outlets_by_category.json"),
            JSON.stringify(outlets_by_category, null, 2),
          );
        } catch (err) {
          console.log(err);
          log({
            city_uid: city.uid,
            category_uid: category.uid,
            err,
          });
        }
      }
    }

    for (const service of services) {
      if (service.options.length < 1) {
        for (const city of cities) {
          const outlets: any[] = [];

          count++;
          console.log(count);

          try {
            const response = await axios({
              method: "post",
              url: ENDPOINT,
              data: {
                tx_lbopointsdeservice_eid: {
                  ville: city.uid,
                  sujet: category.uid,
                  service: service.uid,
                },
              },
              headers: { "Content-Type": "multipart/form-data" },
            });

            if (response.data.markers.length < 1) {
              continue;
            }

            for (const index in response.data.markers) {
              response.data.markers[index].city_uid = city.uid;
            }

            for (let i = 0; i < response.data.markers.length; i++) {
              const render_1 = response.data.render.split(`id="pointDeService-${response.data.markers[i].letter}"`)[1];

              const render_2 = render_1.split('id="pointDeService-')[0];

              const render = render_2 || render_1;

              if (
                render.includes("<strong>without any appointments") ||
                render.includes("<strong>without appointment")
              ) {
                response.data.markers[i].service_point = "WITHOUT_APPOINTMENT";
                continue;
              }

              if (render.includes("The offices of this service outlet are closed for an indefinite period.")) {
                response.data.markers[i].service_point = "INDEFINITLY_CLOSED";
                continue;
              }

              if (render.includes("The offices of this service outlet are closed until")) {
                response.data.markers[i].service_point = "CLOSED_UNTIL";
                continue;
              }

              if (render.includes("To avoid waiting in line, you can make an appointment at")) {
                response.data.markers[i].service_point = "APPPOINTMENT_BY_PHONE";
                continue;
              }

              if (render.includes("https://outlook.office365.com/owa/calendar/")) {
                response.data.markers[i].service_point = render
                  .split("https://outlook.office365.com/owa/calendar/")[1]
                  .split("@")[0];
                continue;
              }

              const service_point = render.split("https://saaq.gouv.qc.ca/prise-de-rendez-vous/?point-de-service=");

              response.data.markers[i].service_point = service_point[1].split('"')[0];
            }

            outlets.push(...response.data.markers);

            const file = fs.readFileSync(path.resolve("./src/data/outlets_by_category.json"));

            const outlets_by_category = JSON.parse(file.toString());

            outlets_by_category[`${category.uid}:${service.uid}`] = outlets_by_category[
              `${category.uid}:${service.uid}`
            ]
              ? [...outlets_by_category[`${category.uid}:${service.uid}`], ...outlets]
              : outlets;

            fs.writeFileSync(
              path.resolve("./src/data/outlets_by_category.json"),
              JSON.stringify(outlets_by_category, null, 2),
            );
          } catch (err) {
            console.log(err);
            log({
              city_uid: city.uid,
              category_uid: category.uid,
              service_uid: service.uid,
              err,
            });
          }
        }
      }

      for (const option of service.options) {
        for (const city of cities) {
          const outlets: any[] = [];

          count++;
          console.log(count);

          try {
            const response = await axios({
              method: "post",
              url: ENDPOINT,
              data: {
                tx_lbopointsdeservice_eid: {
                  ville: city.uid,
                  sujet: category.uid,
                  service: service.uid,
                  options: option.uid,
                },
              },
              headers: { "Content-Type": "multipart/form-data" },
            });

            if (response.data.markers.length < 1) {
              continue;
            }

            for (const index in response.data.markers) {
              response.data.markers[index].city_uid = city.uid;
            }

            for (let i = 0; i < response.data.markers.length; i++) {
              const render_1 = response.data.render.split(`id="pointDeService-${response.data.markers[i].letter}"`)[1];

              const render_2 = render_1.split('id="pointDeService-')[0];

              const render = render_2 || render_1;

              if (
                render.includes("<strong>without any appointments") ||
                render.includes("<strong>without appointment")
              ) {
                response.data.markers[i].service_point = "WITHOUT_APPOINTMENT";
                continue;
              }

              if (render.includes("The offices of this service outlet are closed for an indefinite period.")) {
                response.data.markers[i].service_point = "INDEFINITLY_CLOSED";
                continue;
              }

              if (render.includes("The offices of this service outlet are closed until")) {
                response.data.markers[i].service_point = "TEMPORARILY_CLOSED";
                continue;
              }

              if (render.includes("To avoid waiting in line, you can make an appointment at")) {
                response.data.markers[i].service_point = "APPPOINTMENT_BY_PHONE";
                continue;
              }

              if (render.includes("https://outlook.office365.com/owa/calendar/")) {
                response.data.markers[i].service_point = render
                  .split("https://outlook.office365.com/owa/calendar/")[1]
                  .split("@")[0];
                continue;
              }

              const service_point = render.split("https://saaq.gouv.qc.ca/prise-de-rendez-vous/?point-de-service=");

              response.data.markers[i].service_point = service_point[1].split('"')[0];
            }

            outlets.push(...response.data.markers);

            const file = fs.readFileSync(path.resolve("./src/data/outlets_by_category.json"));

            const outlets_by_category = JSON.parse(file.toString());

            outlets_by_category[`${category.uid}:${service.uid}:${option.uid}`] = outlets_by_category[
              `${category.uid}:${service.uid}:${option.uid}`
            ]
              ? [...outlets_by_category[`${category.uid}:${service.uid}:${option.uid}`], ...outlets]
              : outlets;

            fs.writeFileSync(
              path.resolve("./src/data/outlets_by_category.json"),
              JSON.stringify(outlets_by_category, null, 2),
            );
          } catch (err) {
            console.log(err);
            log({
              city_uid: city.uid,
              category_uid: category.uid,
              service_uid: service.uid,
              option_uid: option.uid,
              err,
            });
          }
        }
      }
    }
  }
};

export default findOutlets;
