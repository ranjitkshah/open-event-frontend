import classic from 'ember-classic-decorator';
import Route from '@ember/routing/route';
import moment from 'moment';

@classic
export default class SessionsRoute extends Route {
  queryParams = {
    date: {
      refreshModel: true
    },
    sort: {
      refreshModel: true
    },
    track: {
      refreshModel: true
    },
    room: {
      refreshModel: true
    },
    sessionType: {
      refreshModel: true
    },
    search: {
      refreshModel: true
    },
    my_speaker_sessions: {
      refreshModel: true
    },
    my_schedule: {
      refreshModel: true
    }
  };

  titleToken() {
    return this.l10n.t('Sessions');
  }

  async model(params) {
    const eventDetails = this.modelFor('public');
    const filterOptions = [
      {
        and: [
          {
            or: [
              {
                name : 'state',
                op   : 'eq',
                val  : 'confirmed'
              },
              {
                name : 'state',
                op   : 'eq',
                val  : 'accepted'
              }
            ]
          }
        ]
      }
    ];

    if (params.date) {
      filterOptions.push({
        and: [
          {
            name : 'starts-at',
            op   : 'ge',
            val  : moment.tz(params.date, eventDetails.timezone).toISOString()
          },
          {
            name : 'starts-at',
            op   : 'le',
            val  : moment.tz(params.date, eventDetails.timezone).add(1, 'days').toISOString()
          }
        ]
      });
    }

    if (params.track) {
      filterOptions.push({
        name : 'track',
        op   : 'has',
        val  : {
          name : 'name',
          op   : 'eq',
          val  : params.track
        }
      });
    }

    if (params.sessionType) {
      const sessions = params.sessionType.split(',');
      filterOptions.push({
        name : 'session-type',
        op   : 'has',
        val  : {
          or: sessions.map(val => ({
            name : 'name',
            op   : 'eq',
            val
          }))
        }
      });
    }

    if (params.my_schedule) {
      filterOptions.push({
        name : 'favourites',
        op   : 'any',
        val  : {
          name : 'user',
          op   : 'has',
          val  : {
            name : 'id',
            op   : 'eq',
            val  : this.authManager.currentUser.id
          }
        }
      });
    }

    if (params.room) {
      filterOptions.push({
        name : 'microlocation',
        op   : 'has',
        val  : {
          name : 'name',
          op   : 'eq',
          val  : params.room
        }
      });
    }

    if (params.search) {
      filterOptions.push({
        or: [
          {
            name : 'title',
            op   : 'ilike',
            val  : `%${params.search}%`
          },
          {
            name : 'track',
            op   : 'has',
            val  : {
              name : 'name',
              op   : 'ilike',
              val  : `%${params.search}%`
            }
          },
          {
            name : 'microlocation',
            op   : 'has',
            val  : {
              name : 'name',
              op   : 'ilike',
              val  : `%${params.search}%`
            }
          },
          {
            name : 'speakers',
            op   : 'any',
            val  : {
              name : 'name',
              op   : 'ilike',
              val  : `%${params.search}%`
            }
          }
        ]
      });
    }

    if (params.my_speaker_sessions) {
      filterOptions.push({
        name : 'speakers',
        op   : 'any',
        val  : {
          name : 'email',
          op   : 'eq',
          val  : this.authManager.currentUser.email
        }
      });
    }

    return {
      event   : eventDetails,
      session : await this.infinity.model('sessions', {
        include      : 'track,speakers,session-type,favourite,microlocation.video-stream',
        filter       : filterOptions,
        sort         : (params.sort === 'favourite-count') ? '-favourite-count' : params.sort || 'starts-at',
        perPage      : 6,
        startingPage : 1,
        perPageParam : 'page[size]',
        pageParam    : 'page[number]',
        store        : eventDetails
      })
    };
  }
}
