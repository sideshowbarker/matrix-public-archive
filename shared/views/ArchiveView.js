'use strict';

const {
  TemplateView,
  AvatarView,
  RoomView,
  RightPanelView,
  LightboxView,
  viewClassForTile,
} = require('hydrogen-view-sdk');

class RoomHeaderView extends TemplateView {
  render(t, vm) {
    return t.div({ className: 'RoomHeader middle-header' }, [
      t.view(new AvatarView(vm, 32)),
      t.div({ className: 'room-description' }, [t.h2((vm) => vm.name)]),
      t.button(
        {
          className: 'button-utility room-header-change-dates-button',
          'aria-label': vm.i18n`Change dates`,
          onClick: (/*evt*/) => {
            vm.openRightPanel();
          },
        },
        [
          // Calendar icon (via `calendar2-date` from Bootstrap)
          t.svg(
            {
              xmlns: 'http://www.w3.org/2000/svg',
              width: '16',
              height: '16',
              viewBox: '0 0 16 16',
              fill: 'currentColor',
              style: 'vertical-align: middle;',
            },
            [
              t.path({
                d: 'M6.445 12.688V7.354h-.633A12.6 12.6 0 0 0 4.5 8.16v.695c.375-.257.969-.62 1.258-.777h.012v4.61h.675zm1.188-1.305c.047.64.594 1.406 1.703 1.406 1.258 0 2-1.066 2-2.871 0-1.934-.781-2.668-1.953-2.668-.926 0-1.797.672-1.797 1.809 0 1.16.824 1.77 1.676 1.77.746 0 1.23-.376 1.383-.79h.027c-.004 1.316-.461 2.164-1.305 2.164-.664 0-1.008-.45-1.05-.82h-.684zm2.953-2.317c0 .696-.559 1.18-1.184 1.18-.601 0-1.144-.383-1.144-1.2 0-.823.582-1.21 1.168-1.21.633 0 1.16.398 1.16 1.23z',
              }),
              t.path({
                d: 'M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM2 2a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H2z',
              }),
              t.path({
                d: 'M2.5 4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5V4z',
              }),
            ]
          ),
        ]
      ),
    ]);
  }
}

class ArchiveView extends TemplateView {
  render(t, vm) {
    const rootElement = t.div(
      {
        className: {
          ArchiveView: true,
          'right-shown': (vm) => vm.shouldShowRightPanel,
        },
      },
      [
        t.style({}, (vm) => {
          return `
            [data-event-id] {
              transition: background-color 800ms;
            }
            [data-event-id="${vm.currentTopPositionEventEntry?.id}"] {
              background-color: #ffff8a;
              outline: 1px solid #f00;
              outline-offset: -1px;
              transition: background-color 0ms;
            }
          `;
        }),
        t.view(
          new RoomView(vm.roomViewModel, viewClassForTile, {
            RoomHeaderView,
          })
        ),
        t.view(new RightPanelView(vm.rightPanelModel)),
        t.mapView(
          (vm) => vm.lightboxViewModel,
          (lightboxViewModel) => (lightboxViewModel ? new LightboxView(lightboxViewModel) : null)
        ),
      ]
    );

    if (typeof IntersectionObserver === 'function') {
      const scrollRoot = rootElement.querySelector('.Timeline_scroller');
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const eventId = entry.target.getAttribute('data-event-id');
            const eventEntry = vm.eventEntriesByEventId[eventId];
            vm.setCurrentTopPositionEventEntry(eventEntry);
          });
        },
        {
          root: scrollRoot,
          // We want the message at the top of the viewport to be the one
          // representing the current active day.
          //
          // This is a trick that pushes the bottom margin up to the top of the
          // root so there is just a 0px region at the top to detect
          // intersections. This way we always recognize the element at the top.
          // As mentioned in:
          //  - https://stackoverflow.com/a/54874286/796832
          //  - https://css-tricks.com/an-explanation-of-how-the-intersection-observer-watches/#aa-creating-a-position-sticky-event
          //
          // The format is the same as margin: top, left, bottom, right.
          rootMargin: '0px 0px -100% 0px',
          threshold: 0,
        }
      );
      [...rootElement.querySelectorAll(`.Timeline_message`)].forEach((el) => {
        observer.observe(el);
      });
    }

    return rootElement;
  }
}

module.exports = ArchiveView;
