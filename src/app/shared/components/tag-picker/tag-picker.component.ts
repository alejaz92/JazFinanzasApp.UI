import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgFor, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TagService } from '../../../features/tag/services/tag.service';
import { Tag } from '../../../features/tag/models/tag.model';

@Component({
    selector: 'app-tag-picker',
    templateUrl: './tag-picker.component.html',
    styleUrls: ['./tag-picker.component.css'],
    imports: [NgFor, NgClass, RouterLink]
})
export class TagPickerComponent implements OnInit {
  @Input() selectedTagIds: number[] = [];
  @Output() selectedTagIdsChange = new EventEmitter<number[]>();

  tags: Tag[] = [];

  constructor(private tagService: TagService) { }

  ngOnInit(): void {
    this.tagService.getAllTags().subscribe((data) => {
      this.tags = data;
    });
  }

  isSelected(tagId: number): boolean {
    return this.selectedTagIds.includes(tagId);
  }

  toggle(tagId: number): void {
    this.selectedTagIds = this.isSelected(tagId)
      ? this.selectedTagIds.filter((id) => id !== tagId)
      : [...this.selectedTagIds, tagId];
    this.selectedTagIdsChange.emit(this.selectedTagIds);
  }
}
