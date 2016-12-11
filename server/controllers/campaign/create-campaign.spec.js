const { expect } = require('chai');
const createCampaign = require('./create-campaign');
const {
  sequelize,
  campaignanalytics: CampaignAnalytics,
  campaign: Campaign,
  user: User,
  list: List,
  listsubscriber: ListSubscriber
} = require('../../models');

describe('createCampaign', () => {
  let mockResponse = (callback) => { return { send: callback } };
  describe('normal cases', () => {
    let res = { };
    let user, list;
    beforeEach(done => {
      sequelize.sync({ force: true }).then(() => {
        User.create({}).then(createdUser => {
          user = createdUser;
          List.create({
            name: 'list1',
            userId: user.id
          }).then(createdList => {
            list = createdList;
            ListSubscriber.bulkCreate([
              { listId: list.id, email: 'someone@someone.com' },
              { listId: list.id, email: 'someone2@someone.com' },
              { listId: list.id, email: 'someone3@someone.com' }
            ]).then(() => {
              const request = {
                body: {
                  listName: 'list1',
                  userId: user.id,
                  campaignName: 'my new campaign',
                  fromName: 'joe bob',
                  fromEmail: 'joe@bob.com',
                  emailSubject: 'joe bob is a cool guy',
                  type: 'Html',
                  trackingPixelEnabled: true,
                  unsubscribeLinkEnabled: false,
                  trackLinksEnabled: true
                },
                user: { id: user.id }
              }
              createCampaign(request, mockResponse(function (data) {
                res = data;
                done();
              }))
            })
          })
        })
      })
    })

    it('responds with a success message', () => {
      expect(res.message).to.be.equal('New campaign successfully created');
    });

    it('sets the user id correctly', done => {
      Campaign.findById(1).done((campaign => {
        const data = campaign.dataValues;
        expect(data.userId).to.be.equal(user.id);
        done();
      }))
    });

    it('sets the list id correctly', done => {
      Campaign.findById(1).done((campaign => {
        const data = campaign.dataValues;
        expect(data.listId).to.be.equal(list.id);
        done();
      }))
    });

    it('creates the new campaign with the specified body fields', done => {
      Campaign.findById(1).done((campaign) => {
        const data = campaign.dataValues;
        expect(data.name).to.be.equal('my new campaign');
        expect(data.fromName).to.be.equal('joe bob');
        expect(data.fromEmail).to.be.equal('joe@bob.com');
        expect(data.emailSubject).to.be.equal('joe bob is a cool guy');
        expect(data.type).to.be.equal('Html');
        expect(data.trackingPixelEnabled).to.be.true;
        expect(data.unsubscribeLinkEnabled).to.be.false;
        expect(data.trackLinksEnabled).to.be.true;
        done();
      })
    })

    it('creates a campaign analytics entry', done => {
      CampaignAnalytics.findOne({ where: {
        campaignId: 1
      }}).done((campaignAnalytics => {
        expect(campaignAnalytics).to.exist;
        done();
      }))
    });
  })
})
